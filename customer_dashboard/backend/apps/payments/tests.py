from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.cart.models import Cart, CartItem
from apps.inventory.models import ProductInventory
from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment, PaymentStatus
from apps.products.models import Product
from apps.pricing.models import ProductPricing
from apps.users.models import Address
from apps.categories.models import Category
from apps.brands.models import Brand

User = get_user_model()

class PaymentModuleTests(APITestCase):
    def setUp(self):
        # Create standard test category & brand
        self.category = Category.objects.create(name="Instruments", slug="instruments")
        self.brand = Brand.objects.create(name="NSK", slug="nsk")

        # Create user
        self.user = User.objects.create_user(
            email="doctor@example.com",
            password="testpassword123",
            full_name="Dr. Test User",
            role="customer",
            is_active=True
        )
        self.client.force_authenticate(user=self.user)

        # Create address
        self.address = Address.objects.create(
            user=self.user,
            label="Home",
            full_name="Dr. Test User",
            mobile="9876543210",
            line1="123 Clinic Row",
            city="Mumbai",
            state="Maharashtra",
            pincode="400001",
            address_type="both"
        )

        # Create product with pricing and inventory
        self.product = Product.objects.create(
            name="Curing Light",
            slug="woodpecker-curing-light",
            category=self.category,
            brand=self.brand
        )
        self.pricing = ProductPricing.objects.create(
            product=self.product,
            mrp=Decimal("15000.00"),
            selling_price=Decimal("12000.00"),
            gst_percentage=Decimal("18.00")
        )
        self.inventory = ProductInventory.objects.create(
            product=self.product,
            current_stock=10,
            reserved_stock=0,
            allow_backorders=False
        )

        # Create cart and add product
        self.cart = Cart.objects.create(user=self.user)
        self.cart_item = CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=2
        )

    def test_create_payment_order_success(self):
        url = reverse('payment-create-order')
        data = {
            "address_id": str(self.address.id),
            "delivery_method": "standard",
            "payment_method": "razorpay"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('razorpay_order_id', response.data['data'])
        self.assertIn('payment_id', response.data['data'])

        # Verify payment record is created in db
        payment = Payment.objects.get(id=response.data['data']['payment_id'])
        self.assertEqual(payment.status, PaymentStatus.CREATED)
        self.assertEqual(payment.amount, Decimal("28320.00")) # (12000*2) * 1.18 = 28320

    def test_verify_payment_signature_and_creation(self):
        # First, create payment order
        url_create = reverse('payment-create-order')
        data_create = {
            "address_id": str(self.address.id),
            "delivery_method": "standard",
            "payment_method": "razorpay"
        }
        res_create = self.client.post(url_create, data_create, format='json')
        payment_id = res_create.data['data']['payment_id']
        rz_order_id = res_create.data['data']['razorpay_order_id']

        # Now, verify signature
        url_verify = reverse('payment-verify')
        data_verify = {
            "razorpay_order_id": rz_order_id,
            "razorpay_payment_id": "pay_mock_12345",
            "razorpay_signature": f"sig_mock_{rz_order_id}_pay_mock_12345",
            "payment_id": payment_id
        }
        response = self.client.post(url_verify, data_verify, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

        # Verify database assertions:
        # 1. Order is created
        order_id = response.data['data']['id']
        order = Order.objects.get(id=order_id)
        self.assertEqual(order.user, self.user)
        self.assertEqual(order.total_amount, Decimal("28320.00"))

        # 2. Cart is cleared
        self.assertEqual(CartItem.objects.filter(cart=self.cart).count(), 0)

        # 3. Inventory reserved stock is updated
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.reserved_stock, 2)

        # 4. Payment status is CAPTURED
        payment = Payment.objects.get(id=payment_id)
        self.assertEqual(payment.status, PaymentStatus.CAPTURED)
        self.assertEqual(payment.order, order)

    def test_verify_payment_duplicate_prevention(self):
        # Create payment order
        url_create = reverse('payment-create-order')
        data_create = {
            "address_id": str(self.address.id),
            "delivery_method": "standard",
            "payment_method": "razorpay"
        }
        res_create = self.client.post(url_create, data_create, format='json')
        payment_id = res_create.data['data']['payment_id']
        rz_order_id = res_create.data['data']['razorpay_order_id']

        # Verify payment signature first time
        url_verify = reverse('payment-verify')
        data_verify = {
            "razorpay_order_id": rz_order_id,
            "razorpay_payment_id": "pay_mock_12345",
            "razorpay_signature": f"sig_mock_{rz_order_id}_pay_mock_12345",
            "payment_id": payment_id
        }
        res1 = self.client.post(url_verify, data_verify, format='json')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        # Verify payment signature second time (simulate duplicate click/network retry)
        res2 = self.client.post(url_verify, data_verify, format='json')
        # Return success or ignore to avoid duplicating order
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        # Verify no duplicate orders created (total orders for user is 1)
        self.assertEqual(Order.objects.filter(user=self.user).count(), 1)
