import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Check, 
  CreditCard, 
  Landmark, 
  Truck, 
  Calendar, 
  Percent, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Heart, 
  Info, 
  Lock, 
  MapPin, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Tag, 
  ChevronRight,
  Edit2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usersService } from '../services/users';
import { getAbsoluteImageUrl } from '../services/api';
import { paymentService } from '../services/payment';

interface MockCartItem {
  id: string; // product slug
  name: string;
  category: string;
  price: number;
  qty: number;
  image: string;
  originalPrice?: number;
  cartItemId?: string; // backend cart item ID
}

interface Address {
  id: string;
  type: string;
  dentist: string;
  clinic: string;
  street: string;
  city: string;
  pincode: string;
  phone: string;
}

interface CheckoutPageProps {
  cartItems: MockCartItem[];
  setCurrentView: (view: 'home' | 'portfolio' | 'listing' | 'detail' | 'cart' | 'wishlist' | 'checkout' | 'order-success' | 'my-orders') => void;
  checkoutSource?: 'cart' | 'buy-now';
  onBackCheckout?: () => void;
  showToast?: (message: string) => void;
  onPlaceOrderSuccess: (orderData: {
    id: string;
    items: MockCartItem[];
    address: Address;
    paymentMethod: string;
    pricing: {
      subtotal: number;
      shipping: number;
      gst: number;
      discount: number;
      total: number;
      savings: number;
    };
  }) => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({
  cartItems,
  setCurrentView,
  checkoutSource,
  onBackCheckout,
  showToast,
  onPlaceOrderSuccess,
}) => {
  const { user, profile } = useAuth();

  // Multi-step state: 1 = Address, 2 = Order Review, 3 = Payment
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Local state for cart items (allows quantity changes and removals inside checkout)
  const [items, setItems] = useState<MockCartItem[]>(cartItems);

  // Address list and selection
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addrLoading, setAddrLoading] = useState(false);

  // Address Modal/Form State (For both Adding and Editing)
  const [isAddrFormOpen, setIsAddrFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrFormType, setAddrFormType] = useState('Clinic'); // Clinic / Home / Office
  const [addrFormFullName, setAddrFormFullName] = useState('');
  const [addrFormClinic, setAddrFormClinic] = useState('');
  const [addrFormStreet, setAddrFormStreet] = useState('');
  const [addrFormCity, setAddrFormCity] = useState('');
  const [addrFormState, setAddrFormState] = useState('');
  const [addrFormPincode, setAddrFormPincode] = useState('');
  const [addrFormPhone, setAddrFormPhone] = useState('');

  // GST Invoice State
  const [gstInvoice, setGstInvoice] = useState(false);
  const [gstNumber, setGstNumber] = useState('');
  const [gstCompanyName, setGstCompanyName] = useState('');

  // Personal Contact details (auto-filled from user profile or manual input)
  const [dentistName, setDentistName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Delivery logistics method
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express' | 'install'>('standard');

  // Payment Options
  const [paymentTab, setPaymentTab] = useState<'upi' | 'card' | 'netbank' | 'wallet' | 'emi' | 'cod'>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState('Paytm');
  const [financeOption, setFinanceOption] = useState('3m_nocost');

  // Coupon application state
  const [couponInput, setCouponInput] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<{ code: string; type: 'fixed' | 'percent'; value: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Order Placement progression State
  const [isPlacing, setIsPlacing] = useState(false);
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [sandboxOrderData, setSandboxOrderData] = useState<{
    razorpay_order_id: string;
    amount: number;
    currency: string;
    payment_id: string;
    handler: (response: any) => void;
    ondismiss: () => void;
  } | null>(null);

  // Address list fetcher
  const fetchAddresses = async () => {
    setAddrLoading(true);
    try {
      const res = await usersService.getAddresses();
      if (res.success && res.data) {
        const mapped = res.data.map(addr => ({
          id: addr.id,
          type: addr.label || 'Clinic',
          dentist: addr.full_name,
          clinic: addr.line1,
          street: addr.line2 || '',
          city: `${addr.city}, ${addr.state}`,
          pincode: addr.pincode,
          phone: addr.mobile
        }));
        setAddresses(mapped);
        
        // Auto-select primary / default address
        if (mapped.length > 0) {
          const defaultAddr = res.data.find(a => a.is_default);
          const lastSavedSelectedId = localStorage.getItem('faazo_checkout_selected_address_id');
          if (lastSavedSelectedId && mapped.some(a => a.id === lastSavedSelectedId)) {
            setSelectedAddressId(lastSavedSelectedId);
          } else {
            setSelectedAddressId(defaultAddr ? defaultAddr.id : mapped[0].id);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load user addresses:', e);
    } finally {
      setAddrLoading(false);
    }
  };

  // Sync state with localStorage to auto-save checkout progress
  useEffect(() => {
    fetchAddresses();
    
    // Load personal info
    if (user) {
      setDentistName(localStorage.getItem('faazo_checkout_dentist_name') || user.full_name || '');
      setEmail(localStorage.getItem('faazo_checkout_email') || user.email || '');
    }

    const savedClinicName = localStorage.getItem('faazo_checkout_clinic_name');
    if (savedClinicName) {
      setClinicName(savedClinicName);
    } else if (profile?.clinic_name) {
      setClinicName(profile.clinic_name);
    }
    
    const savedPhone = localStorage.getItem('faazo_checkout_phone');
    if (savedPhone) setPhone(savedPhone);

    const savedGstInvoice = localStorage.getItem('faazo_checkout_gst_invoice');
    if (savedGstInvoice === 'true') setGstInvoice(true);

    const savedGstNumber = localStorage.getItem('faazo_checkout_gst_number');
    if (savedGstNumber) setGstNumber(savedGstNumber);

    const savedGstCompany = localStorage.getItem('faazo_checkout_gst_company');
    if (savedGstCompany) setGstCompanyName(savedGstCompany);

    const savedStep = localStorage.getItem('faazo_checkout_step');
    if (savedStep) {
      const parsedStep = parseInt(savedStep, 10);
      if (parsedStep === 1 || parsedStep === 2 || parsedStep === 3) {
        setCurrentStep(parsedStep as 1 | 2 | 3);
      }
    }

    const savedCoupon = localStorage.getItem('faazo_checkout_coupon');
    if (savedCoupon) {
      try {
        const parsed = JSON.parse(savedCoupon);
        setActiveCoupon(parsed);
        setCouponInput(parsed.code);
      } catch (err) {
        // ignore
      }
    }
  }, [user, profile]);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('faazo_checkout_dentist_name', dentistName);
    localStorage.setItem('faazo_checkout_clinic_name', clinicName);
    localStorage.setItem('faazo_checkout_email', email);
    localStorage.setItem('faazo_checkout_phone', phone);
    localStorage.setItem('faazo_checkout_gst_invoice', gstInvoice ? 'true' : 'false');
    localStorage.setItem('faazo_checkout_gst_number', gstNumber);
    localStorage.setItem('faazo_checkout_gst_company', gstCompanyName);
    localStorage.setItem('faazo_checkout_selected_address_id', selectedAddressId);
    localStorage.setItem('faazo_checkout_step', currentStep.toString());
    if (activeCoupon) {
      localStorage.setItem('faazo_checkout_coupon', JSON.stringify(activeCoupon));
    } else {
      localStorage.removeItem('faazo_checkout_coupon');
    }
  }, [dentistName, clinicName, email, phone, gstInvoice, gstNumber, gstCompanyName, selectedAddressId, currentStep, activeCoupon]);

  // Prevent accidental tab refreshes or close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave the checkout? Your progress will be saved.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // --- CALCULATION LOGIC ---
  const subtotal = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  
  const deliveryFee = {
    standard: 0,
    express: 1500,
    install: 3500,
  }[deliveryMethod];

  const gstAmount = Math.round(subtotal * 0.18);

  const totalOriginalPrice = items.reduce((acc, item) => {
    const orig = item.originalPrice || Math.round(item.price * 1.25);
    return acc + orig * item.qty;
  }, 0);

  let couponDiscount = 0;
  if (activeCoupon) {
    if (activeCoupon.type === 'fixed') {
      couponDiscount = activeCoupon.value;
    } else {
      couponDiscount = Math.round(subtotal * (activeCoupon.value / 100));
    }
  }

  const baseProductDiscount = totalOriginalPrice - subtotal;
  const overallDiscount = baseProductDiscount + couponDiscount;
  const orderTotal = subtotal + gstAmount + deliveryFee - couponDiscount;
  const overallSavings = overallDiscount;

  // --- CALCULATION OVERRIDES VIA BACKEND PREVIEW ---
  const [previewPricing, setPreviewPricing] = useState<{
    mrp_subtotal: number;
    selling_subtotal: number;
    gst_amount: number;
    shipping_fee: number;
    total_amount: number;
    savings: number;
  } | null>(null);

  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (!selectedAddressId || selectedAddressId.length < 10) return;
    
    const loadPreview = async () => {
      setPreviewLoading(true);
      try {
        const { cartService } = await import('../services/cart');
        const itemsPayload = checkoutSource === 'buy-now' 
          ? items.map(item => ({ product_id: item.id, quantity: item.qty })) 
          : undefined;
        const res = await cartService.checkoutPreview(selectedAddressId, deliveryMethod, itemsPayload);
        if (res.success && res.data) {
          setPreviewPricing(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setPreviewLoading(false);
      }
    };
    loadPreview();
  }, [selectedAddressId, deliveryMethod, items, checkoutSource]);

  const gstAmountVal = previewPricing ? previewPricing.gst_amount : gstAmount;
  const deliveryFeeVal = previewPricing ? previewPricing.shipping_fee : deliveryFee;
  const totalOriginalPriceVal = previewPricing ? previewPricing.mrp_subtotal : totalOriginalPrice;
  const baseProductDiscountVal = previewPricing ? (previewPricing.mrp_subtotal - previewPricing.selling_subtotal) : baseProductDiscount;
  const orderTotalVal = previewPricing ? (previewPricing.total_amount - couponDiscount) : orderTotal;
  const overallSavingsVal = previewPricing ? (previewPricing.savings + couponDiscount) : overallSavings;
  const couponDiscountVal = couponDiscount;

  // --- QUANTITY & CART MANIPULATION ---
  const handleUpdateQty = async (cartItemId: string | undefined, productSlug: string, newQty: number) => {
    if (newQty < 1) return;
    
    // Optimistic update
    setItems(prev => prev.map(item => item.id === productSlug ? { ...item, qty: newQty } : item));
    
    try {
      if (checkoutSource !== 'buy-now' && cartItemId) {
        const { cartService } = await import('../services/cart');
        await cartService.updateItem(cartItemId, newQty);
      }
    } catch (e) {
      console.error(e);
      showToast?.('Failed to update quantity.');
    }
  };

  const handleRemoveItem = async (cartItemId: string | undefined, productSlug: string) => {
    // Confirm first
    if (!window.confirm('Remove this product from checkout?')) return;
    
    // Optimistic update
    setItems(prev => prev.filter(item => item.id !== productSlug));
    
    try {
      if (checkoutSource !== 'buy-now' && cartItemId) {
        const { cartService } = await import('../services/cart');
        await cartService.removeItem(cartItemId);
      }
      showToast?.('Item removed.');
    } catch (e) {
      console.error(e);
      showToast?.('Failed to remove item.');
    }
  };

  const handleSaveForLater = (productName: string, productSlug: string, cartItemId?: string) => {
    showToast?.(`"${productName}" saved for later!`);
    handleRemoveItem(cartItemId, productSlug);
  };

  // --- ADDRESS ACTIONS ---
  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddrFormType('Clinic');
    setAddrFormFullName(user?.full_name || '');
    setAddrFormClinic('');
    setAddrFormStreet('');
    setAddrFormCity('');
    setAddrFormState('');
    setAddrFormPincode('');
    setAddrFormPhone('');
    setIsAddrFormOpen(true);
  };

  const handleOpenEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddrFormType(addr.type);
    setAddrFormFullName(addr.dentist);
    setAddrFormClinic(addr.clinic);
    setAddrFormStreet(addr.street);
    
    // Deconstruct city & state
    const parts = addr.city.split(',').map(s => s.trim());
    setAddrFormCity(parts[0] || '');
    setAddrFormState(parts[1] || '');
    setAddrFormPincode(addr.pincode);
    setAddrFormPhone(addr.phone);
    setIsAddrFormOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrFormFullName || !addrFormClinic || !addrFormStreet || !addrFormCity || !addrFormState || !addrFormPincode || !addrFormPhone) {
      showToast?.('Please fill out all address fields.');
      return;
    }
    if (!/^\d{6}$/.test(addrFormPincode.trim())) {
      showToast?.('Pincode must be exactly 6 digits.');
      return;
    }
    
    const payload = {
      label: addrFormType,
      full_name: addrFormFullName,
      mobile: addrFormPhone,
      line1: addrFormClinic,
      line2: addrFormStreet,
      city: addrFormCity.trim(),
      state: addrFormState.trim(),
      pincode: addrFormPincode.trim(),
      address_type: 'both' as const,
      is_default: addresses.length === 0
    };

    try {
      let res;
      if (editingAddressId) {
        res = await usersService.updateAddress(editingAddressId, payload);
      } else {
        res = await usersService.createAddress(payload);
      }

      if (res.success && res.data) {
        showToast?.(editingAddressId ? 'Address updated!' : 'Address added!');
        setIsAddrFormOpen(false);
        fetchAddresses();
        if (!editingAddressId) {
          setSelectedAddressId(res.data.id);
        }
      } else {
        showToast?.('Failed to save address details.');
      }
    } catch (err: any) {
      console.error(err);
      showToast?.('Failed to save address.');
    }
  };

  const handleDeleteAddress = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await usersService.deleteAddress(id);
      if (res.success) {
        showToast?.('Address deleted.');
        if (selectedAddressId === id) setSelectedAddressId('');
        fetchAddresses();
      }
    } catch (err) {
      console.error(err);
      showToast?.('Failed to delete address.');
    }
  };

  // --- COUPON HANDLERS ---
  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    
    if (code === 'WELCOMEFAAZO') {
      setActiveCoupon({ code: 'WELCOMEFAAZO', type: 'fixed', value: 1000 });
      showToast?.('Promo WELCOMEFAAZO applied!');
    } else if (code === 'CLINICOFF') {
      setActiveCoupon({ code: 'CLINICOFF', type: 'percent', value: 10 });
      showToast?.('Promo CLINICOFF applied!');
    } else {
      setCouponError('Invalid Coupon code.');
    }
  };

  const handleRemoveCoupon = () => {
    setActiveCoupon(null);
    setCouponInput('');
    setCouponError('');
    showToast?.('Coupon removed.');
  };

  // --- ORDER DISPATCH ---
  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      showToast?.('Checkout cart is empty.');
      return;
    }
    if (!dentistName || !email || !phone) {
      showToast?.('Contact and Practice Info must be filled.');
      setCurrentStep(1); // go back
      return;
    }
    if (!selectedAddressId) {
      showToast?.('Please choose a delivery address.');
      setCurrentStep(1); // go back
      return;
    }
    if (gstInvoice && (!gstNumber || !gstCompanyName)) {
      showToast?.('Please fill out complete GSTIN details.');
      return;
    }

    setIsPlacing(true);

    try {
      const scriptLoaded = await paymentService.loadScript();
      if (!scriptLoaded) {
        showToast?.('Failed to load Razorpay SDK. Please check your internet connection.');
        setIsPlacing(false);
        return;
      }

      // Map payment methods cleanly
      const paymentMethodName = {
        upi: `UPI VPA: ${upiId || 'Direct Scan'}`,
        card: `Debit/Credit Card ending ${cardNumber.slice(-4) || '4321'}`,
        netbank: `Netbanking - ${selectedBank}`,
        wallet: `Wallet - ${selectedWallet}`,
        emi: `EMI Finance - (${financeOption})`,
        cod: `Cash on Delivery`
      }[paymentTab];

      const itemsPayload = checkoutSource === 'buy-now' 
        ? items.map(item => ({ product_id: item.id, quantity: item.qty })) 
        : undefined;

      const gstPayload = gstInvoice ? `${gstNumber} | ${gstCompanyName}` : undefined;

      const createRes = await paymentService.createPaymentOrder({
        address_id: selectedAddressId,
        delivery_method: deliveryMethod,
        payment_method: paymentMethodName,
        gst_number: gstPayload,
        items: itemsPayload
      });

      if (!createRes.success || !createRes.data) {
        showToast?.(createRes.message || 'Payment initialization failed.');
        setIsPlacing(false);
        return;
      }

      const rzOrder = createRes.data;

      const options = {
        key: rzOrder.key_id,
        amount: rzOrder.amount,
        currency: rzOrder.currency,
        name: 'FAAZO Dental Solutions',
        description: 'Secure Equipment Procurement',
        order_id: rzOrder.razorpay_order_id,
        handler: async (response: any) => {
          setIsPlacing(true);
          showToast?.('Verifying payment signature...');
          try {
            const verifyRes = await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_id: rzOrder.payment_id,
            });

            if (verifyRes.success && verifyRes.data) {
              showToast?.('Order placed successfully!');
              
              // Clear stored checkout cache
              localStorage.removeItem('faazo_checkout_step');
              localStorage.removeItem('faazo_checkout_coupon');

              const selectedAddrObj = addresses.find(a => a.id === selectedAddressId);
              
              onPlaceOrderSuccess({
                id: verifyRes.data.id || rzOrder.razorpay_order_id,
                items: items,
                address: selectedAddrObj || {
                  id: selectedAddressId,
                  type: 'Clinic',
                  dentist: dentistName,
                  clinic: clinicName,
                  street: '',
                  city: '',
                  pincode: '',
                  phone: phone
                },
                paymentMethod: paymentMethodName,
                pricing: {
                  subtotal: subtotal,
                  shipping: deliveryFeeVal,
                  gst: gstAmountVal,
                  discount: couponDiscountVal + baseProductDiscountVal,
                  total: orderTotalVal,
                  savings: overallSavingsVal
                }
              });
            } else {
              showToast?.(verifyRes.message || 'Signature verification failed.');
            }
          } catch (err: any) {
            showToast?.(err.response?.data?.error?.message || 'Payment verification failed.');
          } finally {
            setIsPlacing(false);
          }
        },
        prefill: {
          name: dentistName,
          email: email,
          contact: phone,
        },
        notes: {
          payment_id: rzOrder.payment_id
        },
        theme: {
          color: '#006670',
        },
        modal: {
          ondismiss: () => {
            setIsPlacing(false);
            showToast?.('Transaction cancelled.');
          }
        }
      };

      // Detect Sandbox/Simulator Mode
      const isSandbox = 
        rzOrder.razorpay_order_id.startsWith('order_mock_') ||
        !rzOrder.key_id ||
        rzOrder.key_id.includes('REPLACE') ||
        rzOrder.key_id === '';

      if (isSandbox) {
        setSandboxOrderData({
          razorpay_order_id: rzOrder.razorpay_order_id,
          amount: rzOrder.amount,
          currency: rzOrder.currency,
          payment_id: rzOrder.payment_id,
          handler: options.handler,
          ondismiss: options.modal.ondismiss,
        });
        setShowSandboxModal(true);
        setIsPlacing(false);
        return;
      }

      // Real Mode
      const rzInstance = new (window as any).Razorpay(options);
      rzInstance.on('payment.failed', function (resp: any) {
        console.error('Payment failed:', resp.error);
        showToast?.(`Payment failed: ${resp.error.description}`);
        setIsPlacing(false);
      });
      rzInstance.open();

    } catch (err: any) {
      console.error(err);
      showToast?.(err.response?.data?.error?.message || 'Failed to initialize payment gateway.');
      setIsPlacing(false);
    }
  };

  const handleBackNavigation = () => {
    if (window.confirm('Are you sure you want to go back? Your current checkout state is saved.')) {
      if (onBackCheckout) {
        onBackCheckout();
      } else {
        setCurrentView('cart');
      }
    }
  };

  return (
    <div className="w-full bg-[#f8fafc] min-h-screen pt-[120px] lg:pt-[180px] pb-24 text-left select-none font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Back Action */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={handleBackNavigation}
            className="group inline-flex items-center gap-2 text-sm font-bold text-[#006670] hover:text-[#004d55] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>
          
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
            Checkout source: {checkoutSource === 'buy-now' ? 'Buy Now' : 'Cart'}
          </span>
        </div>

        {/* PROGRESS STEPPER HEADER */}
        <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-6 mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="max-w-3xl mx-auto flex items-center justify-between relative">
            
            {/* Step 1 */}
            <button 
              onClick={() => currentStep > 1 && setCurrentStep(1)}
              disabled={currentStep === 1}
              className="flex flex-col items-center gap-2 z-10 focus:outline-none disabled:cursor-default cursor-pointer group"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300
                ${currentStep === 1 
                  ? 'bg-[#006670] text-white ring-4 ring-teal-50' 
                  : currentStep > 1 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-100 text-slate-400'}`}>
                {currentStep > 1 ? <Check className="w-5 h-5 stroke-[3]" /> : '1'}
              </div>
              <span className={`text-[11px] font-extrabold uppercase tracking-wider
                ${currentStep === 1 ? 'text-[#006670]' : 'text-slate-500 group-hover:text-slate-800'}`}>Address</span>
            </button>

            {/* Link line 1 */}
            <div className={`flex-1 h-0.5 mx-4 transition-all duration-500
              ${currentStep > 1 ? 'bg-emerald-500' : 'bg-slate-100'}`} />

            {/* Step 2 */}
            <button 
              onClick={() => currentStep > 2 && setCurrentStep(2)}
              disabled={currentStep <= 2}
              className="flex flex-col items-center gap-2 z-10 focus:outline-none disabled:cursor-default cursor-pointer group"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300
                ${currentStep === 2 
                  ? 'bg-[#006670] text-white ring-4 ring-teal-50' 
                  : currentStep > 2 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-100 text-slate-400'}`}>
                {currentStep > 2 ? <Check className="w-5 h-5 stroke-[3]" /> : '2'}
              </div>
              <span className={`text-[11px] font-extrabold uppercase tracking-wider
                ${currentStep === 2 ? 'text-[#006670]' : 'text-slate-500 group-hover:text-slate-800'}`}>Order Review</span>
            </button>

            {/* Link line 2 */}
            <div className={`flex-1 h-0.5 mx-4 transition-all duration-500
              ${currentStep > 2 ? 'bg-emerald-500' : 'bg-slate-100'}`} />

            {/* Step 3 */}
            <button 
              disabled 
              className="flex flex-col items-center gap-2 z-10 focus:outline-none disabled:cursor-default"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300
                ${currentStep === 3 
                  ? 'bg-[#006670] text-white ring-4 ring-teal-50' 
                  : 'bg-slate-100 text-slate-400'}`}>
                '3'
              </div>
              <span className={`text-[11px] font-extrabold uppercase tracking-wider
                ${currentStep === 3 ? 'text-[#006670]' : 'text-slate-400'}`}>Payment</span>
            </button>

          </div>
        </div>

        {/* TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (70%) */}
          <div className="lg:col-span-8 space-y-6">

            {/* STEP 1: Address & Shipping Details */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* Contact & Professional Info Card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 pb-2 border-b border-slate-100">
                    Contact & Professional Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Dentist Name</label>
                      <input 
                        type="text" 
                        value={dentistName}
                        onChange={(e) => setDentistName(e.target.value)}
                        className="border border-slate-200 hover:border-slate-300 focus:border-[#006670] px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white transition-colors outline-none"
                        placeholder="Dr. Aditya Sharma"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Clinic Name</label>
                      <input 
                        type="text" 
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                        className="border border-slate-200 hover:border-slate-300 focus:border-[#006670] px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white transition-colors outline-none"
                        placeholder="Aesthetic Dental Center"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Email Address</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border border-slate-200 hover:border-slate-300 focus:border-[#006670] px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white transition-colors outline-none"
                        placeholder="doctor@example.com"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Mobile Phone</label>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="border border-slate-200 hover:border-slate-300 focus:border-[#006670] px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white transition-colors outline-none"
                        placeholder="9876543210"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Address Selection Card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                      Select Delivery Address
                    </h3>
                    
                    <button
                      onClick={handleOpenAddAddress}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#006670] hover:text-[#004e56] cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add New Address
                    </button>
                  </div>

                  {addrLoading ? (
                    <div className="flex items-center justify-center py-12 gap-2 text-slate-400 text-xs font-bold">
                      <Loader2 className="w-4 h-4 animate-spin text-[#006670]" />
                      <span>Loading saved clinic addresses...</span>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="py-10 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                      <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-500">No saved addresses found.</p>
                      <button
                        onClick={handleOpenAddAddress}
                        className="mt-4 px-5 py-2.5 bg-[#006670] hover:bg-[#004d55] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                      >
                        Add Clinic Address
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr) => {
                        const isSelected = addr.id === selectedAddressId;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`group relative p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 flex flex-col justify-between hover:shadow-[0_4px_20px_rgba(0,102,112,0.04)]
                              ${isSelected 
                                ? 'border-[#006670] bg-[#006670]/[0.02] shadow-[0_2px_15px_rgba(0,102,112,0.02)]' 
                                : 'border-slate-200 bg-white hover:border-slate-300'}`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className={`text-[9px] font-extrabold tracking-widest px-3 py-1 rounded-full uppercase
                                  ${isSelected ? 'bg-[#006670] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                  {addr.type}
                                </span>
                                
                                <div className="flex items-center gap-2 opacity-60 hover:opacity-100">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleOpenEditAddress(addr); }} 
                                    className="p-1 text-slate-400 hover:text-[#006670] transition-colors"
                                    title="Edit address"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={(e) => handleDeleteAddress(addr.id, e)} 
                                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                    title="Delete address"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <h4 className="text-xs font-black text-slate-800 mb-1">{addr.dentist}</h4>
                              <p className="text-[11.5px] font-medium text-slate-600">{addr.clinic}</p>
                              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-sans">{addr.street}</p>
                              <p className="text-[11px] text-slate-500 font-sans">{addr.city} - {addr.pincode}</p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-500 font-sans">Mob: {addr.phone}</span>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAddressId(addr.id);
                                  setCurrentStep(2);
                                }}
                                className={`px-4 py-1.5 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-colors
                                  ${isSelected 
                                    ? 'bg-[#006670] hover:bg-[#004d55] text-white' 
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                              >
                                Deliver Here
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Optional GST Request Block */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={gstInvoice}
                      onChange={(e) => setGstInvoice(e.target.checked)}
                      className="mt-1 w-4.5 h-4.5 rounded text-[#006670] focus:ring-[#006670] accent-[#006670]"
                    />
                    <div>
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Request GST Business Invoice</span>
                      <span className="text-[11px] text-slate-400 font-sans mt-0.5 block leading-normal">
                        Claim input tax credits (18% GST value deduction) on your medical business purchase.
                      </span>
                    </div>
                  </label>

                  {gstInvoice && (
                    <div className="mt-6 p-5 bg-[#006670]/[0.01] border border-slate-200 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">GSTIN Registration Number</label>
                        <input 
                          type="text"
                          value={gstNumber}
                          onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                          className="border border-slate-200 hover:border-slate-300 focus:border-[#006670] px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white outline-none"
                          placeholder="e.g. 27AAAAA1111A1Z1"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Registered Company / Clinic Name</label>
                        <input 
                          type="text"
                          value={gstCompanyName}
                          onChange={(e) => setGstCompanyName(e.target.value)}
                          className="border border-slate-200 hover:border-slate-300 focus:border-[#006670] px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white outline-none"
                          placeholder="Aesthetic Dental Clinic Pvt Ltd"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Continue CTA Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      if (!selectedAddressId) {
                        showToast?.('Please select or add a delivery address.');
                        return;
                      }
                      if (!dentistName || !phone) {
                        showToast?.('Please fill out contact details.');
                        return;
                      }
                      setCurrentStep(2);
                    }}
                    className="px-8 py-3.5 bg-[#006670] hover:bg-[#004d55] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Order Review</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* STEP 2: Order Review Content */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 pb-2 border-b border-slate-100">
                    Review Your Order
                  </h3>

                  {items.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-bold">
                      Your checkout queue is empty.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {items.map((item) => {
                        const originalVal = item.originalPrice || Math.round(item.price * 1.25);
                        return (
                          <div key={item.id} className="py-6 first:pt-0 last:pb-0 flex flex-col md:flex-row gap-5 items-start">
                            
                            {/* Product Image */}
                            <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-xl p-2 flex items-center justify-center shrink-0">
                              <img 
                                src={getAbsoluteImageUrl(item.image)} 
                                alt={item.name} 
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0 text-left space-y-1.5">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h4 className="text-xs font-black text-slate-800 leading-snug">{item.name}</h4>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans block mt-0.5">
                                    Category: {item.category}
                                  </span>
                                </div>
                                <div className="text-right font-sans shrink-0">
                                  <div className="text-xs font-black text-[#006670]">₹{item.price.toLocaleString('en-IN')}</div>
                                  <div className="text-[10px] font-bold text-slate-400 line-through">₹{originalVal.toLocaleString('en-IN')}</div>
                                </div>
                              </div>

                              {/* Badges / Tech Info */}
                              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                                <span className="inline-flex items-center gap-1 bg-[#006670]/[0.04] text-[#006670] border border-[#006670]/10 text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-md">
                                  1-Year Warranty
                                </span>
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-md">
                                  In Stock
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 font-sans">
                                  Est. Delivery: {new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>

                              {/* Quantity Selector & Action Buttons */}
                              <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                                <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                                  <button
                                    onClick={() => handleUpdateQty(item.cartItemId, item.id, item.qty - 1)}
                                    className="w-7 h-7 flex items-center justify-center text-xs font-black text-slate-600 hover:bg-white hover:shadow-xs rounded-md transition-all cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="w-10 text-center text-xs font-extrabold text-slate-800">{item.qty}</span>
                                  <button
                                    onClick={() => handleUpdateQty(item.cartItemId, item.id, item.qty + 1)}
                                    className="w-7 h-7 flex items-center justify-center text-xs font-black text-slate-600 hover:bg-white hover:shadow-xs rounded-md transition-all cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>

                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleSaveForLater(item.name, item.id, item.cartItemId)}
                                    className="inline-flex items-center gap-1 text-[11px] font-extrabold text-slate-400 hover:text-[#006670] transition-colors cursor-pointer"
                                  >
                                    <Heart className="w-3.5 h-3.5" />
                                    <span>Save for Later</span>
                                  </button>
                                  <button
                                    onClick={() => handleRemoveItem(item.cartItemId, item.id)}
                                    className="inline-flex items-center gap-1 text-[11px] font-extrabold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Delivery Logistics Selection Card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 pb-2 border-b border-slate-100">
                    Logistics & Calibration Setup
                  </h3>

                  <div className="grid grid-cols-1 gap-3">
                    <label 
                      onClick={() => setDeliveryMethod('standard')}
                      className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200
                        ${deliveryMethod === 'standard' 
                          ? 'border-[#006670] bg-[#006670]/[0.02]' 
                          : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <div className="flex gap-3">
                        <Truck className="w-5 h-5 text-[#006670] shrink-0 mt-0.5" />
                        <div className="text-left font-sans">
                          <h4 className="text-xs font-black text-slate-800">Standard Transit</h4>
                          <p className="text-[10.5px] text-slate-400 mt-0.5">Estimated delivery: 3-5 days • Free shipping</p>
                        </div>
                      </div>
                      <input type="radio" checked={deliveryMethod === 'standard'} readOnly className="accent-[#006670]" />
                    </label>

                    <label 
                      onClick={() => setDeliveryMethod('express')}
                      className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200
                        ${deliveryMethod === 'express' 
                          ? 'border-[#006670] bg-[#006670]/[0.02]' 
                          : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <div className="flex gap-3">
                        <Truck className="w-5 h-5 text-[#006670] shrink-0 mt-0.5" />
                        <div className="text-left font-sans">
                          <h4 className="text-xs font-black text-slate-800">Express Medical Shipping (+₹1,500)</h4>
                          <p className="text-[10.5px] text-slate-400 mt-0.5">Estimated delivery: 1-2 days • Expedited cold-chain logistics</p>
                        </div>
                      </div>
                      <input type="radio" checked={deliveryMethod === 'express'} readOnly className="accent-[#006670]" />
                    </label>

                    <label 
                      onClick={() => setDeliveryMethod('install')}
                      className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200
                        ${deliveryMethod === 'install' 
                          ? 'border-[#006670] bg-[#006670]/[0.02]' 
                          : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <div className="flex gap-3">
                        <Calendar className="w-5 h-5 text-[#006670] shrink-0 mt-0.5" />
                        <div className="text-left font-sans">
                          <h4 className="text-xs font-black text-slate-800">Calibration & Engineer Setup (+₹3,500)</h4>
                          <p className="text-[10.5px] text-slate-400 mt-0.5">Custom scheduling • Professional calibration & testing by certified engineers</p>
                        </div>
                      </div>
                      <input type="radio" checked={deliveryMethod === 'install'} readOnly className="accent-[#006670]" />
                    </label>
                  </div>
                </div>

                {/* Continue CTA Button */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3.5 border border-slate-200 hover:border-slate-300 text-slate-600 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer bg-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Address</span>
                  </button>

                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-8 py-3.5 bg-[#006670] hover:bg-[#004d55] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* STEP 3: Redesigned Payment Layout */}
            {currentStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* Expandable Tabs Left Panel */}
                <div className="md:col-span-8 space-y-4">
                  
                  {/* Tab 1: UPI */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <button
                      onClick={() => setPaymentTab('upi')}
                      className={`w-full p-4 flex items-center justify-between text-xs font-extrabold uppercase tracking-wider border-b border-slate-100 transition-colors cursor-pointer
                        ${paymentTab === 'upi' ? 'bg-[#006670]/[0.02] text-[#006670]' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> UPI (Scan QR / VPA)
                      </span>
                      <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${paymentTab === 'upi' ? 'rotate-90' : ''}`} />
                    </button>

                    {paymentTab === 'upi' && (
                      <div className="p-6 bg-white animate-in slide-in-from-top-1 duration-200 space-y-4 text-center">
                        <div className="flex justify-center">
                          <div className="border border-slate-200 p-3 bg-white rounded-xl shadow-xs">
                            <img 
                              src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=upi://pay?pa=faazo@okaxis&pn=FAAZO%20Retail" 
                              alt="Scan to pay" 
                              className="w-24 h-24"
                            />
                          </div>
                        </div>
                        <div className="max-w-xs mx-auto space-y-2">
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Scan QR Code or enter VPA ID</label>
                          <input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="e.g. adityasharma@okaxis"
                            className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white text-center focus:border-[#006670] outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tab 2: Credit/Debit Cards */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <button
                      onClick={() => setPaymentTab('card')}
                      className={`w-full p-4 flex items-center justify-between text-xs font-extrabold uppercase tracking-wider border-b border-slate-100 transition-colors cursor-pointer
                        ${paymentTab === 'card' ? 'bg-[#006670]/[0.02] text-[#006670]' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Credit / Debit Card
                      </span>
                      <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${paymentTab === 'card' ? 'rotate-90' : ''}`} />
                    </button>

                    {paymentTab === 'card' && (
                      <div className="p-6 bg-white animate-in slide-in-from-top-1 duration-200 space-y-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Cardholder Name</label>
                          <input 
                            type="text" 
                            value={cardName} 
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="Dr. Aditya Sharma" 
                            className="border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white focus:border-[#006670] outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Card Number</label>
                          <input 
                            type="text" 
                            maxLength={19}
                            value={cardNumber} 
                            onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                            placeholder="4321 5678 9012 3456" 
                            className="border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white focus:border-[#006670] outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Expiry (MM/YY)</label>
                            <input 
                              type="text" 
                              maxLength={5}
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              placeholder="12/28" 
                              className="border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white focus:border-[#006670] outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">CVV</label>
                            <input 
                              type="password" 
                              maxLength={3}
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                              placeholder="***" 
                              className="border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white focus:border-[#006670] outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tab 3: Netbanking */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <button
                      onClick={() => setPaymentTab('netbank')}
                      className={`w-full p-4 flex items-center justify-between text-xs font-extrabold uppercase tracking-wider border-b border-slate-100 transition-colors cursor-pointer
                        ${paymentTab === 'netbank' ? 'bg-[#006670]/[0.02] text-[#006670]' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span className="flex items-center gap-2">
                        <Landmark className="w-4 h-4" /> Net Banking
                      </span>
                      <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${paymentTab === 'netbank' ? 'rotate-90' : ''}`} />
                    </button>

                    {paymentTab === 'netbank' && (
                      <div className="p-6 bg-white animate-in slide-in-from-top-1 duration-200 space-y-4">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">Select Bank</span>
                        <div className="grid grid-cols-2 gap-3">
                          {['HDFC Bank', 'SBI', 'ICICI Bank', 'Axis Bank'].map((bank) => (
                            <button
                              key={bank}
                              type="button"
                              onClick={() => setSelectedBank(bank)}
                              className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center
                                ${selectedBank === bank 
                                  ? 'border-[#006670] bg-[#e6f3f5]/20 text-[#006670]' 
                                  : 'border-slate-200 bg-white text-slate-600'}`}
                            >
                              {bank}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tab 4: Wallets */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <button
                      onClick={() => setPaymentTab('wallet')}
                      className={`w-full p-4 flex items-center justify-between text-xs font-extrabold uppercase tracking-wider border-b border-slate-100 transition-colors cursor-pointer
                        ${paymentTab === 'wallet' ? 'bg-[#006670]/[0.02] text-[#006670]' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Digital Wallets
                      </span>
                      <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${paymentTab === 'wallet' ? 'rotate-90' : ''}`} />
                    </button>

                    {paymentTab === 'wallet' && (
                      <div className="p-6 bg-white animate-in slide-in-from-top-1 duration-200 space-y-4">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">Select Wallet</span>
                        <div className="grid grid-cols-3 gap-3">
                          {['Paytm', 'PhonePe', 'Amazon Pay'].map((w) => (
                            <button
                              key={w}
                              type="button"
                              onClick={() => setSelectedWallet(w)}
                              className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center
                                ${selectedWallet === w 
                                  ? 'border-[#006670] bg-[#e6f3f5]/20 text-[#006670]' 
                                  : 'border-slate-200 bg-white text-slate-600'}`}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tab 5: EMI */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <button
                      onClick={() => setPaymentTab('emi')}
                      className={`w-full p-4 flex items-center justify-between text-xs font-extrabold uppercase tracking-wider border-b border-slate-100 transition-colors cursor-pointer
                        ${paymentTab === 'emi' ? 'bg-[#006670]/[0.02] text-[#006670]' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> EMI Options / Financing
                      </span>
                      <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${paymentTab === 'emi' ? 'rotate-90' : ''}`} />
                    </button>

                    {paymentTab === 'emi' && (
                      <div className="p-6 bg-white animate-in slide-in-from-top-1 duration-200 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label
                            onClick={() => setFinanceOption('3m_nocost')}
                            className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200
                              ${financeOption === '3m_nocost' 
                                ? 'border-[#006670] bg-[#006670]/[0.02]' 
                                : 'border-slate-200 bg-white'}`}
                          >
                            <div className="text-left">
                              <h4 className="text-xs font-black text-slate-800">3-Month No Cost EMI</h4>
                              <p className="text-[10px] text-slate-400 font-sans mt-0.5">₹{Math.round(orderTotalVal/3).toLocaleString('en-IN')}/mo • 0% Interest</p>
                            </div>
                            <input type="radio" checked={financeOption === '3m_nocost'} readOnly className="accent-[#006670]" />
                          </label>

                          <label
                            onClick={() => setFinanceOption('6m_interest')}
                            className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200
                              ${financeOption === '6m_interest' 
                                ? 'border-[#006670] bg-[#006670]/[0.02]' 
                                : 'border-slate-200 bg-white'}`}
                          >
                            <div className="text-left">
                              <h4 className="text-xs font-black text-slate-800">6-Month Low Cost EMI</h4>
                              <p className="text-[10px] text-slate-400 font-sans mt-0.5">₹{Math.round((orderTotalVal * 1.05)/6).toLocaleString('en-IN')}/mo • 10% Interest</p>
                            </div>
                            <input type="radio" checked={financeOption === '6m_interest'} readOnly className="accent-[#006670]" />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tab 6: Cash on Delivery (only for totals < ₹50,000) */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <button
                      onClick={() => setPaymentTab('cod')}
                      disabled={orderTotalVal > 50000}
                      className={`w-full p-4 flex items-center justify-between text-xs font-extrabold uppercase tracking-wider border-b border-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                        ${paymentTab === 'cod' ? 'bg-[#006670]/[0.02] text-[#006670]' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span className="flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Cash on Delivery (COD)
                      </span>
                      <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${paymentTab === 'cod' ? 'rotate-90' : ''}`} />
                    </button>

                    {paymentTab === 'cod' && (
                      <div className="p-6 bg-white animate-in slide-in-from-top-1 duration-200 space-y-2 text-center text-xs text-slate-600 font-sans">
                        <p>Pay upon delivery is selected. Ensure cash or UPI transfer is ready when delivery reaches your clinic.</p>
                      </div>
                    )}

                    {orderTotalVal > 50000 && (
                      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>Unavailable for totals above ₹50,000</span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Panel Mini Summary / CTA */}
                <div className="md:col-span-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs text-left">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">
                    Payment Details
                  </h4>
                  <div className="space-y-2 text-xs font-sans text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-bold text-slate-800">₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18% inclusive)</span>
                      <span className="font-bold text-slate-800">₹{gstAmountVal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span className="font-bold text-slate-800">
                        {deliveryFeeVal === 0 ? <span className="text-emerald-600 uppercase font-black text-[10px]">Free</span> : `₹${deliveryFeeVal.toLocaleString('en-IN')}`}
                      </span>
                    </div>
                    {couponDiscountVal > 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>Coupon Savings</span>
                        <span>-₹{couponDiscountVal.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-100 pt-3 mt-3 flex justify-between text-sm font-black text-slate-900">
                      <span>Grand Total</span>
                      <span className="text-[#006670] text-base">₹{orderTotalVal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={isPlacing}
                    className="w-full py-3.5 mt-6 rounded-xl bg-[#006670] hover:bg-[#004d55] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isPlacing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Pay Securely</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setCurrentStep(2)}
                    className="w-full mt-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 text-[10.5px] font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Back to Order Review
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* Right Sticky Column (30%) */}
          {currentStep !== 3 && (
            <div className="lg:col-span-4 lg:sticky lg:top-[120px] space-y-4">
              
              {/* Order summary details */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3.5 mb-4 text-left">
                  Procurement Summary
                </h4>

                {/* Mini Item List */}
                <div className="max-h-[180px] overflow-y-auto pr-1 space-y-3.5 border-b border-slate-100 pb-4 mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <img 
                          src={getAbsoluteImageUrl(item.image)} 
                          alt={item.name} 
                          className="w-8 h-8 object-contain bg-slate-50 border border-slate-100 p-0.5 rounded shrink-0" 
                        />
                        <span className="font-extrabold text-slate-700 truncate">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-500 font-sans shrink-0">
                        {item.qty} × ₹{item.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Calculation breakdown list */}
                {previewLoading ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-slate-400 text-xs font-bold">
                    <Loader2 className="w-4 h-4 animate-spin text-[#006670]" />
                    <span>Calculating totals...</span>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs font-sans text-slate-600">
                    <div className="flex justify-between">
                      <span>Gross Value</span>
                      <span className="font-bold text-slate-800">₹{totalOriginalPriceVal.toLocaleString('en-IN')}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>FAAZO Discount</span>
                      <span className="font-extrabold text-emerald-600">-₹{baseProductDiscountVal.toLocaleString('en-IN')}</span>
                    </div>

                    {couponDiscountVal > 0 && (
                      <div className="flex justify-between font-bold text-emerald-600">
                        <span>Promo Applied</span>
                        <span>-₹{couponDiscountVal.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Medical GST (18%)</span>
                      <span className="font-bold text-slate-800">₹{gstAmountVal.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Logistics Fee</span>
                      <span className="font-bold text-slate-800">
                        {deliveryFeeVal === 0 ? <span className="text-emerald-600 font-black uppercase text-[10px]">Free</span> : `₹${deliveryFeeVal.toLocaleString('en-IN')}`}
                      </span>
                    </div>

                    <div className="border-t border-slate-100 pt-3.5 mt-2 flex justify-between text-sm font-black text-slate-900 border-b border-slate-100 pb-3.5">
                      <span>Total Invoice</span>
                      <span className="text-[#006670] text-base">₹{orderTotalVal.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="pt-2 font-black text-emerald-600 text-[11px] text-center bg-emerald-50/50 border border-emerald-100/50 py-2 rounded-xl">
                      Saved On This Procurement: ₹{overallSavingsVal.toLocaleString('en-IN')}
                    </div>
                  </div>
                )}

                {/* Main Action CTA */}
                <button
                  onClick={() => {
                    if (currentStep === 1) {
                      if (!selectedAddressId) {
                        showToast?.('Please choose delivery address.');
                        return;
                      }
                      setCurrentStep(2);
                    } else if (currentStep === 2) {
                      setCurrentStep(3);
                    }
                  }}
                  className="w-full py-4 mt-6 rounded-xl bg-[#006670] hover:bg-[#004d55] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{currentStep === 1 ? 'Review Order Details' : 'Proceed to Payment'}</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Coupon code container panel */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Apply Coupon code</span>
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="e.g. WELCOMEFAAZO"
                    className="flex-1 border border-slate-200 focus:border-[#006670] px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white outline-none"
                  />
                  {activeCoupon ? (
                    <button 
                      onClick={handleRemoveCoupon}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Clear
                    </button>
                  ) : (
                    <button 
                      onClick={handleApplyCoupon}
                      className="px-4 py-2.5 bg-[#006670] hover:bg-[#004d55] text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Apply
                    </button>
                  )}
                </div>

                {couponError && <p className="text-rose-500 text-[10.5px] font-bold mt-2 ml-1">{couponError}</p>}
                {activeCoupon && (
                  <div className="mt-3.5 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800">Coupon "{activeCoupon.code}" active</span>
                    <span className="text-xs font-black text-emerald-600">Saved ₹{couponDiscountVal.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div 
                    onClick={() => { setCouponInput('WELCOMEFAAZO'); handleApplyCoupon(); }}
                    className="flex justify-between items-center text-[10px] font-bold text-slate-500 cursor-pointer hover:text-[#006670]"
                  >
                    <span>WELCOMEFAAZO (Flat ₹1,000 Off)</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                  <div 
                    onClick={() => { setCouponInput('CLINICOFF'); handleApplyCoupon(); }}
                    className="flex justify-between items-center text-[10px] font-bold text-slate-500 cursor-pointer hover:text-[#006670]"
                  >
                    <span>CLINICOFF (10% Off)</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Trust badges panel */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3.5 text-slate-700 text-xs">
                <div className="flex gap-3 items-start">
                  <Shield className="w-5 h-5 text-[#006670] shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">Secured Procurement Gateway</h5>
                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Transactions fully verified with HMAC-SHA256 signature audits.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-[#006670] shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">Manufacturer Warranty Eligible</h5>
                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Direct factory certifications with warranty coverage details logged instantly.</p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* NEW ADDRESS & EDIT ADDRESS MODAL */}
      {isAddrFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                {editingAddressId ? 'Edit Clinic Address' : 'Add New Address'}
              </h3>
              <button 
                onClick={() => setIsAddrFormOpen(false)}
                className="text-xs font-black text-slate-400 hover:text-slate-700 cursor-pointer uppercase tracking-wider"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">Address Label</label>
                  <select 
                    value={addrFormType}
                    onChange={(e) => setAddrFormType(e.target.value)}
                    className="border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 bg-white"
                  >
                    <option value="Clinic">Primary Clinic</option>
                    <option value="Home">Home Address</option>
                    <option value="Office">Office HQ</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">Contact Dentist Name</label>
                  <input 
                    type="text" 
                    required
                    value={addrFormFullName}
                    onChange={(e) => setAddrFormFullName(e.target.value)}
                    className="border border-slate-200 px-3 py-2.5 rounded-lg text-xs font-bold text-slate-800 bg-white"
                    placeholder="Dr. Aditya Kumar"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">Clinic Name</label>
                <input 
                  type="text" 
                  required
                  value={addrFormClinic}
                  onChange={(e) => setAddrFormClinic(e.target.value)}
                  className="border border-slate-200 px-3 py-2.5 rounded-lg text-xs font-bold text-slate-800 bg-white"
                  placeholder="Aesthetic Dental Center"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">Street details & building</label>
                <input 
                  type="text" 
                  required
                  value={addrFormStreet}
                  onChange={(e) => setAddrFormStreet(e.target.value)}
                  className="border border-slate-200 px-3 py-2.5 rounded-lg text-xs font-bold text-slate-800 bg-white"
                  placeholder="e.g. 102 Medical Arcade"
                />
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">City</label>
                  <input 
                    type="text" 
                    required
                    value={addrFormCity}
                    onChange={(e) => setAddrFormCity(e.target.value)}
                    className="border border-slate-200 px-3 py-2.5 rounded-lg text-xs font-bold text-slate-800 bg-white"
                    placeholder="Mumbai"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">State</label>
                  <input 
                    type="text" 
                    required
                    value={addrFormState}
                    onChange={(e) => setAddrFormState(e.target.value)}
                    className="border border-slate-200 px-3 py-2.5 rounded-lg text-xs font-bold text-slate-800 bg-white"
                    placeholder="Maharashtra"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">Pincode</label>
                  <input 
                    type="text" 
                    required
                    inputMode="numeric"
                    maxLength={6}
                    value={addrFormPincode}
                    onChange={(e) => setAddrFormPincode(e.target.value.replace(/\D/g, ''))}
                    className="border border-slate-200 px-3 py-2.5 rounded-lg text-xs font-bold text-slate-800 bg-white"
                    placeholder="400050"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400">Contact phone at Delivery Point</label>
                <input 
                  type="text" 
                  required
                  inputMode="numeric"
                  value={addrFormPhone}
                  onChange={(e) => setAddrFormPhone(e.target.value)}
                  className="border border-slate-200 px-3 py-2.5 rounded-lg text-xs font-bold text-slate-800 bg-white"
                  placeholder="9876543210"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 rounded-xl bg-[#006670] hover:bg-[#004d55] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                {editingAddressId ? 'Update Address Details' : 'Save & Select Address'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RAZORPAY SANDBOX DEVELOPER SIMULATOR MODAL */}
      {showSandboxModal && sandboxOrderData && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100/80 text-center space-y-6 animate-scale-in">
            <div className="flex justify-center">
              <div className="p-3.5 bg-emerald-50 rounded-2xl">
                <Shield className="w-8 h-8 text-[#006670]" />
              </div>
            </div>
            
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-wide uppercase">
                FAAZO Payment Sandbox
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Developer simulation of Razorpay secure overlay
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl text-left text-xs space-y-2 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Order ID</span>
                <span className="font-mono font-bold text-slate-700">{sandboxOrderData.razorpay_order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Payment ID</span>
                <span className="font-mono font-bold text-slate-700">{sandboxOrderData.payment_id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Currency</span>
                <span className="font-bold text-slate-700">{sandboxOrderData.currency}</span>
              </div>
              <div className="border-t border-slate-200/60 my-2 pt-2 flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Total Amount</span>
                <span className="font-extrabold text-sm text-[#006670]">₹{(sandboxOrderData.amount / 100).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-amber-50/60 border border-amber-100 p-3 rounded-xl leading-relaxed text-left">
              <strong>Test Mode Simulation:</strong> To run signature verification without live keys, select "Simulate Success". This constructs a secure mock signature matching the backend expected format.
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSandboxModal(false);
                  const mockPayId = `pay_mock_${Math.random().toString(36).substring(2, 10)}`;
                  sandboxOrderData.handler({
                    razorpay_order_id: sandboxOrderData.razorpay_order_id,
                    razorpay_payment_id: mockPayId,
                    razorpay_signature: `sig_mock_${sandboxOrderData.razorpay_order_id}_${mockPayId}`,
                  });
                }}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold uppercase transition-all shadow-sm cursor-pointer"
              >
                Simulate Success
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSandboxModal(false);
                  sandboxOrderData.ondismiss();
                }}
                className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold uppercase transition-all shadow-sm cursor-pointer"
              >
                Simulate Failure
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setShowSandboxModal(false);
                sandboxOrderData.ondismiss();
              }}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 block mx-auto cursor-pointer"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
