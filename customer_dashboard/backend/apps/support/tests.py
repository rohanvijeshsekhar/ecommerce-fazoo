import os
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from apps.support.models import SupportTicket, SupportMessage, TicketTimeline, TicketStatus, TicketPriority, TicketCategory
from apps.notifications.models import Notification
from apps.orders.models import Order
from apps.products.models import Product

User = get_user_model()

class SupportModuleTestCase(APITestCase):
    def setUp(self):
        # Create users
        self.customer1 = User.objects.create_user(
            email="customer1@faazo.com",
            password="Password123",
            full_name="Dr. Customer One",
            role="customer"
        )
        self.customer2 = User.objects.create_user(
            email="customer2@faazo.com",
            password="Password123",
            full_name="Dr. Customer Two",
            role="customer"
        )
        self.admin_user = User.objects.create_superuser(
            email="admin@faazo.com",
            password="Password123",
            full_name="Admin Boss",
            role="admin"
        )

        # Create base structures
        from apps.brands.models import Brand
        from apps.categories.models import Category
        from apps.users.models import Address
        from apps.orders.models import OrderStatus
        from decimal import Decimal

        self.brand = Brand.objects.create(name="FAAZO Labs", slug="faazo-labs", warranty_months_default=12)
        self.category = Category.objects.create(name="Handpieces", slug="handpieces")

        self.address = Address.objects.create(
            user=self.customer1,
            label="Clinic Main",
            full_name="Dr. Customer One",
            mobile="9876543210",
            line1="12 Medical Center",
            city="Delhi",
            state="Delhi",
            pincode="110001",
            address_type="both"
        )

        self.product = Product.objects.create(
            name="FAAZO Premium Dental Handpiece",
            sku="FAZ-HP-001",
            slug="faazo-premium-dental-handpiece",
            brand=self.brand,
            category=self.category,
            warranty_months=12
        )

        self.order = Order.objects.create(
            user=self.customer1,
            shipping_address=self.address,
            order_number="ORD-2026-0001",
            status="delivered",
            payment_method="razorpay",
            mrp_subtotal=Decimal("15000.00"),
            selling_subtotal=Decimal("15000.00"),
            gst_amount=Decimal("2700.00"),
            shipping_fee=Decimal("0.00"),
            total_amount=Decimal("17700.00")
        )

    def test_ticket_creation(self):
        self.client.force_authenticate(user=self.customer1)
        url = reverse("support-ticket-list")
        
        data = {
            "subject": "Faulty compressor installation",
            "category": "installation_help",
            "priority": "high",
            "description": "The compressor makes strange noise upon startup.",
            "related_order": self.order.id,
            "related_product": self.product.id
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        
        # Verify database
        ticket = SupportTicket.objects.get(subject="Faulty compressor installation")
        self.assertEqual(ticket.user, self.customer1)
        self.assertEqual(ticket.category, "installation_help")
        self.assertEqual(ticket.priority, "high")
        self.assertEqual(ticket.status, TicketStatus.OPEN)
        self.assertTrue(ticket.ticket_number.startswith("SUP-"))

        # Verify initial message thread
        self.assertEqual(ticket.messages.count(), 1)
        self.assertEqual(ticket.messages.first().message, data["description"])

        # Verify timeline log
        self.assertEqual(ticket.timeline.count(), 1)
        self.assertEqual(ticket.timeline.first().action, "Ticket Created")

        # Verify notification created
        self.assertEqual(Notification.objects.filter(user=self.customer1).count(), 1)
        self.assertEqual(Notification.objects.first().title, "Support Ticket Created")

    def test_ticket_reply(self):
        # Create a ticket first
        ticket = SupportTicket.objects.create(
            user=self.customer1,
            subject="Technical query",
            category="technical_assistance",
            priority="medium",
            description="Need technical manual."
        )
        
        # Customer replies
        self.client.force_authenticate(user=self.customer1)
        url = reverse("support-ticket-reply", kwargs={"pk": ticket.pk})
        
        data = {"message": "Here is some extra information."}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ticket.messages.count(), 1)
        self.assertEqual(ticket.messages.first().message, "Here is some extra information.")

        # Admin replies
        self.client.force_authenticate(user=self.admin_user)
        data = {"message": "Sure, check your email."}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify status shift to WAITING_CUSTOMER
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, TicketStatus.WAITING_CUSTOMER)

        # Verify Customer notification
        self.assertTrue(Notification.objects.filter(user=self.customer1, title="Support Helpdesk Reply").exists())

    def test_admin_status_changes(self):
        ticket = SupportTicket.objects.create(
            user=self.customer1,
            subject="Hardware bug",
            category="technical_assistance",
            priority="medium",
            description="Trouble with handpiece."
        )

        self.client.force_authenticate(user=self.admin_user)
        url = reverse("support-ticket-admin-action", kwargs={"pk": ticket.pk})

        # 1. Assign Admin
        response = self.client.post(url, {"action": "assign", "assigned_admin": str(self.admin_user.id), "notes": "Assigning to myself"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ticket.refresh_from_db()
        self.assertEqual(ticket.assigned_admin, self.admin_user)
        self.assertEqual(ticket.status, TicketStatus.IN_PROGRESS)

        # 2. Change Priority
        response = self.client.post(url, {"action": "change_priority", "priority": "critical"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ticket.refresh_from_db()
        self.assertEqual(ticket.priority, "critical")

        # 3. Resolve
        response = self.client.post(url, {"action": "resolve"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, TicketStatus.RESOLVED)
        self.assertTrue(Notification.objects.filter(user=self.customer1, title="Support Ticket Resolved").exists())

        # 4. Close
        response = self.client.post(url, {"action": "close"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, TicketStatus.CLOSED)
        self.assertTrue(Notification.objects.filter(user=self.customer1, title="Support Ticket Closed").exists())

    def test_permissions(self):
        # Create ticket for customer 1
        ticket = SupportTicket.objects.create(
            user=self.customer1,
            subject="Customer 1 Inquiry",
            category="other",
            description="Secret inquiry"
        )

        # Customer 2 attempts to read -> Forbidden/404
        self.client.force_authenticate(user=self.customer2)
        url = reverse("support-ticket-detail", kwargs={"pk": ticket.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Customer 2 attempts to reply -> Forbidden/404
        url_reply = reverse("support-ticket-reply", kwargs={"pk": ticket.pk})
        response = self.client.post(url_reply, {"message": "Hack attempt"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Admin accesses -> Success
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_attachments(self):
        self.client.force_authenticate(user=self.customer1)
        url = reverse("support-ticket-list")
        
        # Valid Attachment
        valid_file = SimpleUploadedFile("invoice.pdf", b"pdf content", content_type="application/pdf")
        data = {
            "subject": "Setup manual required",
            "category": "installation_help",
            "priority": "low",
            "description": "Attachment uploaded.",
            "attachment": valid_file
        }
        response = self.client.post(url, data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Invalid Attachment Extension (e.g. .exe)
        invalid_file = SimpleUploadedFile("malware.exe", b"exe content", content_type="application/octet-stream")
        data["attachment"] = invalid_file
        response = self.client.post(url, data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue("error" in response.data or "errors" in response.data or response.status_code == 400)

    def test_search_and_filters(self):
        # Create multiple tickets
        t1 = SupportTicket.objects.create(
            user=self.customer1,
            subject="NSK handpiece delay",
            category="delivery_issue",
            priority="high",
            description="NSK handpiece order delayed."
        )
        t2 = SupportTicket.objects.create(
            user=self.customer2,
            subject="Billing incorrect extra charge",
            category="billing_issue",
            priority="low",
            description="Billing query."
        )

        self.client.force_authenticate(user=self.admin_user)
        url = reverse("support-ticket-list")

        # Search by Ticket Subject
        response = self.client.get(url, {"search": "NSK"})
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(response.data["data"][0]["id"], str(t1.id))

        # Filter by Category
        response = self.client.get(url, {"category": "billing_issue"})
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(response.data["data"][0]["id"], str(t2.id))

        # Filter by Priority
        response = self.client.get(url, {"priority": "high"})
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(response.data["data"][0]["id"], str(t1.id))
