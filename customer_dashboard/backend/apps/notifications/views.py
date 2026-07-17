from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from apps.common.responses import success_response, error_response
from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)
        serializer = NotificationSerializer(notifications, many=True)
        return success_response(data=serializer.data, message="Notifications retrieved successfully.")

class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return error_response("Notification not found.", status_code=status.HTTP_404_NOT_FOUND)

        notif.is_read = True
        notif.save(update_fields=["is_read"])
        serializer = NotificationSerializer(notif)
        return success_response(data=serializer.data, message="Notification marked as read.")

class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return success_response(message="All notifications marked as read.")
