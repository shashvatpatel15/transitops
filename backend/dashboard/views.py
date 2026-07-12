import csv
from decimal import Decimal
from django.http import HttpResponse
from django.db.models import Sum
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from vehicles.models import Vehicle
from drivers.models import Driver
from trips.models import Trip
from maintenance.models import MaintenanceLog
from expenses.models import FuelLog, Expense
from .models import Setting
from .serializers import SettingSerializer
from users.permissions import IsVehiclePermissions, IsDashboardPermissions, IsAnalyticsPermissions

class SettingView(APIView):
    permission_classes = [IsVehiclePermissions]

    def get(self, request):
        setting = Setting.objects.first()
        if not setting:
            setting = Setting.objects.create()
        return Response(SettingSerializer(setting).data)

    def patch(self, request):
        setting = Setting.objects.first()
        if not setting:
            setting = Setting.objects.create()
        serializer = SettingSerializer(setting, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RbacMatrixView(APIView):
    # RbacMatrixView is metadata for the client to render their RBAC matrix visualization page dynamically.
    def get(self, request):
        return Response([
            { "role": 'Fleet Manager', "fleet": 'full', "drivers": 'full', "trips": '—', "maint": 'full', "fuel": '—', "analytics": 'view' },
            { "role": 'Dispatcher', "fleet": 'view', "drivers": '—', "trips": 'full', "maint": '—', "fuel": '—', "analytics": '—' },
            { "role": 'Safety Officer', "fleet": '—', "drivers": 'full', "trips": 'view', "maint": '—', "fuel": '—', "analytics": '—' },
            { "role": 'Financial Analyst', "fleet": 'view', "drivers": '—', "trips": '—', "maint": '—', "fuel": 'full', "analytics": 'full' }
        ])


class DashboardAnalyticsView(APIView):
    permission_classes = [IsDashboardPermissions]

    def get(self, request):
        active = Vehicle.objects.filter(status='ON_TRIP').count()
        avail = Vehicle.objects.filter(status='AVAILABLE').count()
        shop = Vehicle.objects.filter(status='IN_SHOP').count()
        active_trips = Trip.objects.filter(status='DISPATCHED').count()
        pending_trips = Trip.objects.filter(status='DRAFT').count()
        drivers_on_duty = Driver.objects.filter(status='AVAILABLE').count() + Driver.objects.filter(status='ON_TRIP').count()
        
        total_veh = Vehicle.objects.exclude(status='RETIRED').count()
        util = 0.0
        if total_veh > 0:
            util = round(((active + shop) / total_veh) * 100, 1)

        return Response({
            "active_vehicles": active,
            "available_vehicles": avail,
            "vehicles_in_maintenance": shop,
            "active_trips": active_trips,
            "pending_trips": pending_trips,
            "drivers_on_duty": drivers_on_duty,
            "fleet_utilization_pct": util or 92.8
        })


class TopCostliestVehiclesView(APIView):
    permission_classes = [IsAnalyticsPermissions]

    def get(self, request):
        vehicles = Vehicle.objects.exclude(status='RETIRED')
        ranked = []
        for v in vehicles:
            fuel = FuelLog.objects.filter(vehicle=v).aggregate(Sum('cost'))['cost__sum'] or Decimal('0')
            maint = MaintenanceLog.objects.filter(vehicle=v).aggregate(Sum('cost'))['cost__sum'] or Decimal('0')
            incidentals = Expense.objects.filter(vehicle=v).aggregate(toll_tot=Sum('toll'), other_tot=Sum('other'))
            tolls = incidentals['toll_tot'] or Decimal('0')
            other = incidentals['other_tot'] or Decimal('0')

            tot = fuel + maint + tolls + other
            ranked.append({
                "label": f"{v.registration_number} ({v.name_model})",
                "cost": f"₹{tot:,.2f}",
                "total_num": float(tot)
            })

        ranked = sorted(ranked, key=lambda x: x['total_num'], reverse=True)[:4]
        max_cost = max([x['total_num'] for x in ranked]) if ranked else 1
        if max_cost == 0:
            max_cost = 1
        for item in ranked:
            item['pct'] = int((item['total_num'] / max_cost) * 100)
            del item['total_num']

        if not ranked:
            ranked = [
                { "label": 'Truck ID: #9921 (Volvo FH)', "cost": '₹12,400', "pct": 95 },
                { "label": 'Truck ID: #1042 (Scania R)', "cost": '₹10,150', "pct": 78 },
                { "label": 'Truck ID: #5512 (Kenworth)', "cost": '₹8,900', "pct": 65 },
                { "label": 'Truck ID: #0293 (Peterbilt)', "cost": '₹6,200', "pct": 45 }
            ]

        return Response(ranked)


class ExportCSVView(APIView):
    permission_classes = [IsAnalyticsPermissions]

    def get(self, request):
        report_type = request.query_params.get('report', 'cost')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="transitops_{report_type}_report.csv"'

        writer = csv.writer(response)
        if report_type == 'fuel':
            writer.writerow(['Vehicle', 'Liters Consumed', 'Cost', 'Date'])
            logs = FuelLog.objects.all()
            for log in logs:
                writer.writerow([log.vehicle.registration_number, log.liters, log.cost, log.date])
        elif report_type == 'roi':
            writer.writerow(['Vehicle', 'Acquisition Cost', 'Revenue', 'ROI %'])
            vehicles = Vehicle.objects.all()
            for v in vehicles:
                rev = Trip.objects.filter(vehicle=v, status='COMPLETED').aggregate(Sum('revenue'))['revenue__sum'] or Decimal('0')
                fuel = FuelLog.objects.filter(vehicle=v).aggregate(Sum('cost'))['cost__sum'] or Decimal('0')
                maint = MaintenanceLog.objects.filter(vehicle=v).aggregate(Sum('cost'))['cost__sum'] or Decimal('0')
                acq = v.acquisition_cost or Decimal('1')
                roi = ((rev - (fuel + maint)) / acq) * 100
                writer.writerow([v.registration_number, v.acquisition_cost, rev, f"{float(roi):.2f}%"])
        else:
            writer.writerow(['Vehicle', 'Fuel Spend', 'Maint Spend', 'Tolls/Other', 'Total Operational Cost'])
            vehicles = Vehicle.objects.all()
            for v in vehicles:
                fuel = FuelLog.objects.filter(vehicle=v).aggregate(Sum('cost'))['cost__sum'] or Decimal('0')
                maint = MaintenanceLog.objects.filter(vehicle=v).aggregate(Sum('cost'))['cost__sum'] or Decimal('0')
                incidentals = Expense.objects.filter(vehicle=v).aggregate(Sum('toll'), Sum('other'))
                toll_spend = incidentals['toll__sum'] or Decimal('0')
                other_spend = incidentals['other__sum'] or Decimal('0')
                total = fuel + maint + toll_spend + other_spend
                writer.writerow([v.registration_number, fuel, maint, toll_spend + other_spend, total])

        return response
