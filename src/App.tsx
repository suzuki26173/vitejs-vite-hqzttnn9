import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Truck,
  CheckCircle2,
  Package,
  Clock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  X
} from 'lucide-react';
import './App.css';

// --- 型定義 ---
interface Product {
  id: string;
  name: string;
  englishName: string;
  price: number;
  description: string;
  category: 'フィナンシェ' | 'クッキー' | 'カヌレ・マドレーヌ' | 'ギフトボックス';
  image: string;
  tag?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface ShippingInfo {
  name: string;
  email: string;
  postalCode: string;
  address: string;
  deliveryDate: string;
  deliveryTime: string;
}

type CheckoutStep = 'shop' | 'shipping' | 'payment' | 'tracking';

// --- 焼き菓子データ ---
const PRODUCTS: Product[] = [
  {
    id: 'financier-01',
    name: '焦がしバターの極上フィナンシェ',
    englishName: 'Financier Beurre Noisette',
    price: 380,
    description: 'フランス産発酵バターを丁寧に焦がし、スペイン産マルコナアーモンドの香りを閉じ込めました。',
    category: 'フィナンシェ',
    image: 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?auto=format&fit=crop&w=600&q=80',
    tag: '人気 No.1'
  },
  {
    id: 'canele-02',
    name: 'ボルドー産ラム酒香るカヌレ',
    englishName: 'Cannelé de Bordeaux',
    price: 420,
    description: '外はカリッと香ばしく、中はカスタードのようにとろりとした食感。マダガスカル産バニラ使用。',
    category: 'カヌレ・マドレーヌ',
    image: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=600&q=80',
    tag: '数量限定'
  },
  {
    id: 'cookie-03',
    name: 'ゲランドの塩サブレ・ブルトン',
    englishName: 'Sablé Breton au Sel de Guérande',
    price: 350,
    description: 'ザクザクとした厚焼きの食感に、フランス・ゲランド産の海塩がバターの甘みを引き立てます。',
    category: 'クッキー',
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'madeleine-04',
    name: '瀬戸内レモンのハニーマドレーヌ',
    englishName: 'Madeleine au Citron et Miel',
    price: 360,
    description: '国産百花蜂蜜と爽やかな瀬戸内レモンの皮をすりおろして焼き上げた、しっとりとした口当たり。',
    category: 'カヌレ・マドレーヌ',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'cookie-05',
    name: 'アールグレイとホワイトチョコのディアマン',
    englishName: 'Diamant Earl Grey',
    price: 880,
    description: '香り高いベルガモット茶葉を練り込み、周りにグラニュー糖をまぶして焼き上げたクッキー缶（8枚入）。',
    category: 'クッキー',
    image: 'https://images.unsplash.com/photo-1618923850107-d1a234d7a73a?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'gift-06',
    name: 'メゾン特製 焼き菓子アソート（12個入）',
    englishName: 'Coffret Assortiment 12 Pièces',
    price: 4200,
    description: 'フィナンシェ、マドレーヌ、サブレなど人気焼き菓子をオリジナル化粧箱に詰め合わせました。',
    category: 'ギフトボックス',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
    tag: 'ギフト推奨'
  }
];

export function App() {
  // --- State ---
  const [selectedCategory, setSelectedCategory] = useState<string>('すべて');
  const [cart, setCart] = useState<CartItem[]>([
    { ...PRODUCTS[0], quantity: 2 },
    { ...PRODUCTS[1], quantity: 1 }
  ]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [step, setStep] = useState<CheckoutStep>('shop');

  // 配送情報
  const [shipping, setShipping] = useState<ShippingInfo>({
    name: '山田 花子',
    email: 'hanako.yamada@example.com',
    postalCode: '171-0022',
    address: '東京都豊島区南池袋 1-28-1 パティスリービル 302',
    deliveryDate: '2026-11-22',
    deliveryTime: '14:00 - 16:00'
  });

  // Stripe風決済フォームState
  const [cardName, setCardName] = useState('HANAKO YAMADA');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('09 / 29');
  const [cardCvc, setCardCvc] = useState('888');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // 注文完了後のお届けステータス（シミュレーション用 0〜3）
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [deliveryStage, setDeliveryStage] = useState<number>(0);

  // --- 計算ロジック ---
  const categories = ['すべて', 'フィナンシェ', 'カヌレ・マドレーヌ', 'クッキー', 'ギフトボックス'];

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'すべて') return PRODUCTS;
    return PRODUCTS.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const shippingFee = subtotal >= 5000 || subtotal === 0 ? 0 : 650;
  const totalAmount = subtotal + shippingFee;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // --- カート操作 ---
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // --- Stripe決済シミュレーション ---
  const handleStripeCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPayment(true);

    // 実際の実装ではここで backend の /create-payment-intent を叩き
    // stripe.confirmCardPayment() を実行します
    setTimeout(() => {
      setIsProcessingPayment(false);
      const randomOrderNum = 'MS-' + Math.floor(100000 + Math.random() * 900000);
      setOrderNumber(randomOrderNum);
      setDeliveryStage(0);
      setStep('tracking');
      setCart([]); // 注文完了後にカートを空にする
    }, 1600);
  };

  return (
    <div className="app-container">
      {/* ヘッダー */}
      <header className="header">
        <div className="header-inner">
          <div
            className="brand"
            onClick={() => setStep('shop')}
            style={{ cursor: 'pointer' }}
          >
            <span className="brand-en">Maison de Sucre</span>
            <span className="brand-ja">焼き菓子専門オンラインブティック</span>
          </div>

          <div className="header-actions">
            {orderNumber && step !== 'tracking' && (
              <button
                className="track-shortcut-btn"
                onClick={() => setStep('tracking')}
              >
                <Truck size={16} />
                <span>配送状況 ({orderNumber})</span>
              </button>
            )}

            <button
              className="cart-trigger"
              onClick={() => setIsCartOpen(true)}
              aria-label="カートを開く"
            >
              <ShoppingBag size={22} />
              {totalItemsCount > 0 && (
                <span className="cart-badge">{totalItemsCount}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ステッププログレスバー（チェックアウト時） */}
      {step !== 'shop' && (
        <div className="checkout-stepper">
          <div className={`step-item ${step === 'shipping' ? 'active' : 'done'}`}>
            <span className="step-num">1</span>
            <span>お届け先入力</span>
          </div>
          <div className="step-line" />
          <div
            className={`step-item ${
              step === 'payment' ? 'active' : step === 'tracking' ? 'done' : ''
            }`}
          >
            <span className="step-num">2</span>
            <span>お支払い (Stripe)</span>
          </div>
          <div className="step-line" />
          <div className={`step-item ${step === 'tracking' ? 'active' : ''}`}>
            <span className="step-num">3</span>
            <span>注文完了・配送状況</span>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="main-content">
        {/* === VIEW 1: 商品一覧 === */}
        {step === 'shop' && (
          <>
            <section className="hero-banner">
              <div className="hero-text">
                <p className="hero-subtitle">FRESHLY BAKED EVERY MORNING</p>
                <h1>焼きたての香りを、ご自宅へ。</h1>
                <p className="hero-desc">
                  厳選した発酵バターと素材を使用し、パティシエが毎朝丁寧に焼き上げる本格フランス焼き菓子。
                  5,000円以上のご購入で送料無料でお届けします。
                </p>
              </div>
            </section>

            {/* カテゴリフィルター */}
            <div className="category-tabs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 商品グリッド */}
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article key={product.id} className="product-card">
                  <div className="product-image-wrap">
                    <img src={product.image} alt={product.name} loading="lazy" />
                    {product.tag && <span className="product-tag">{product.tag}</span>}
                  </div>
                  <div className="product-info">
                    <span className="product-en">{product.englishName}</span>
                    <h2 className="product-title">{product.name}</h2>
                    <p className="product-desc">{product.description}</p>
                    <div className="product-footer">
                      <span className="product-price">
                        ¥{product.price.toLocaleString()}
                        <small>（税込）</small>
                      </span>
                      <button
                        className="add-btn"
                        onClick={() => addToCart(product)}
                      >
                        <Plus size={16} />
                        カートへ
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {/* === VIEW 2: 配送先情報入力 === */}
        {step === 'shipping' && (
          <div className="checkout-layout">
            <div className="checkout-form-card">
              <button className="back-link" onClick={() => setStep('shop')}>
                <ArrowLeft size={16} /> 商品一覧に戻る
              </button>
              <h2 className="section-heading">お届け先・配送日時の指定</h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep('payment');
                }}
              >
                <div className="form-group">
                  <label>お名前</label>
                  <input
                    type="text"
                    required
                    value={shipping.name}
                    onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>メールアドレス（注文確認・追跡番号通知用）</label>
                  <input
                    type="email"
                    required
                    value={shipping.email}
                    onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>郵便番号</label>
                    <input
                      type="text"
                      required
                      value={shipping.postalCode}
                      onChange={(e) =>
                        setShipping({ ...shipping, postalCode: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>お届け希望日</label>
                    <input
                      type="date"
                      required
                      value={shipping.deliveryDate}
                      onChange={(e) =>
                        setShipping({ ...shipping, deliveryDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>ご住所</label>
                  <input
                    type="text"
                    required
                    value={shipping.address}
                    onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>お届け時間帯</label>
                  <select
                    value={shipping.deliveryTime}
                    onChange={(e) =>
                      setShipping({ ...shipping, deliveryTime: e.target.value })
                    }
                  >
                    <option value="指定なし">指定なし</option>
                    <option value="午前中 (8:00 - 12:00)">午前中 (8:00 - 12:00)</option>
                    <option value="14:00 - 16:00">14:00 - 16:00</option>
                    <option value="16:00 - 18:00">16:00 - 18:00</option>
                    <option value="18:00 - 20:00">18:00 - 20:00</option>
                  </select>
                </div>

                <button type="submit" className="primary-btn full-width">
                  お支払い画面へ進む <ArrowRight size={18} />
                </button>
              </form>
            </div>

            <OrderSummaryBox
              cart={cart}
              subtotal={subtotal}
              shippingFee={shippingFee}
              totalAmount={totalAmount}
            />
          </div>
        )}

        {/* === VIEW 3: Stripe決済モジュール統合画面 === */}
        {step === 'payment' && (
          <div className="checkout-layout">
            <div className="checkout-form-card">
              <button className="back-link" onClick={() => setStep('shipping')}>
                <ArrowLeft size={16} /> お届け先入力に戻る
              </button>

              <div className="stripe-header">
                <div>
                  <h2 className="section-heading">クレジットカード決済</h2>
                  <p className="sub-caption">
                    Stripe Elements による安全な暗号化決済（デモ環境）
                  </p>
                </div>
                <span className="stripe-badge">Powered by Stripe</span>
              </div>

              <div className="shipping-preview">
                <strong>お届け先:</strong> 〒{shipping.postalCode} {shipping.address}（
                {shipping.name} 様）<br />
                <strong>希望日時:</strong> {shipping.deliveryDate} / {shipping.deliveryTime}
              </div>

              {/* Stripe Elements 風のUIフォーム */}
              <form onSubmit={handleStripeCheckout} className="stripe-form">
                <div className="form-group">
                  <label>カード名義人（ローマ字）</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="TARO YAMADA"
                  />
                </div>

                <div className="form-group">
                  <label>カード番号</label>
                  <div className="stripe-input-wrapper">
                    <CreditCard size={18} className="input-icon" />
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                    />
                    <span className="card-brand-pill">VISA</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>有効期限 (MM / YY)</label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM / YY"
                    />
                  </div>
                  <div className="form-group">
                    <label>セキュリティコード (CVC)</label>
                    <input
                      type="text"
                      required
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="security-note">
                  <ShieldCheck size={16} />
                  <span>
                    カード情報は当サイトのサーバーには保存されず、Stripe社へ直接安全に送信されます。
                  </span>
                </div>

                <button
                  type="submit"
                  className="stripe-pay-btn"
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <span className="spinner-text">Stripe 決済処理中...</span>
                  ) : (
                    <span>¥{totalAmount.toLocaleString()} を支払って注文を確定する</span>
                  )}
                </button>
              </form>
            </div>

            <OrderSummaryBox
              cart={cart}
              subtotal={subtotal}
              shippingFee={shippingFee}
              totalAmount={totalAmount}
            />
          </div>
        )}

        {/* === VIEW 4: 注文完了・お届けまでのトラッキングフロー === */}
        {step === 'tracking' && (
          <div className="tracking-container">
            <div className="order-complete-banner">
              <CheckCircle2 size={48} className="success-icon" />
              <h2>ご注文ありがとうございます！</h2>
              <p>
                決済が正常に完了いたしました。確認メールを{' '}
                <strong>{shipping.email}</strong> 宛にお送りしました。
              </p>
              <div className="order-number-box">
                注文番号: <span>{orderNumber}</span>
              </div>
            </div>

            {/* お届けステータスタイムライン */}
            <div className="tracking-card">
              <div className="tracking-header">
                <h3>お届けまでの配送ステータス</h3>
                <button
                  className="simulate-btn"
                  onClick={() => setDeliveryStage((prev) => (prev + 1) % 4)}
                >
                  <Sparkles size={14} /> 配送ステータスを進める（デモ操作）
                </button>
              </div>

              <div className="timeline">
                {[
                  {
                    title: '注文受付・決済完了',
                    desc: 'Stripeでの決済を確認しました。工房へ製造指示を送信しました。',
                    icon: <CheckCircle2 size={20} />
                  },
                  {
                    title: '工房にて焼き上げ・丁寧な梱包',
                    desc: 'パティシエが焼き上げたお菓子を、緩衝材とギフト箱で丁寧に梱包しています。',
                    icon: <Clock size={20} />
                  },
                  {
                    title: 'クール便・ヤマト運輸にて発送完了',
                    desc: '伝票番号: 4920-8831-0024 / 温度管理された配送車でお届け先へ向かっています。',
                    icon: <Truck size={20} />
                  },
                  {
                    title: 'お届け完了',
                    desc: `${shipping.address} への配達が完了しました。美味しいティータイムをお楽しみください！`,
                    icon: <Package size={20} />
                  }
                ].map((stage, idx) => {
                  const isCompleted = idx <= deliveryStage;
                  const isCurrent = idx === deliveryStage;
                  return (
                    <div
                      key={idx}
                      className={`timeline-step ${isCompleted ? 'completed' : ''} ${
                        isCurrent ? 'current' : ''
                      }`}
                    >
                      <div className="timeline-marker">{stage.icon}</div>
                      <div className="timeline-content">
                        <h4>{stage.title}</h4>
                        <p>{stage.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="delivery-details-footer">
                <div>
                  <strong>お届け先住所:</strong> 〒{shipping.postalCode} {shipping.address}
                </div>
                <div>
                  <strong>お届け予定日時:</strong> {shipping.deliveryDate}（
                  {shipping.deliveryTime}）
                </div>
              </div>

              <button
                className="primary-btn"
                style={{ marginTop: '24px' }}
                onClick={() => setStep('shop')}
              >
                ショップトップへ戻る
              </button>
            </div>
          </div>
        )}
      </main>

      {/* スライドイン・ショッピングカートドロワー */}
      {isCartOpen && (
        <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
          <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-header">
              <h3>
                ショッピングカート ({totalItemsCount}点)
              </h3>
              <button
                className="close-btn"
                onClick={() => setIsCartOpen(false)}
                aria-label="閉じる"
              >
                <X size={22} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <ShoppingBag size={48} opacity={0.3} />
                <p>カートに焼き菓子が入っていません。</p>
                <button
                  className="primary-btn"
                  onClick={() => setIsCartOpen(false)}
                >
                  お菓子を選ぶ
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items-list">
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <img src={item.image} alt={item.name} />
                      <div className="cart-item-details">
                        <h4>{item.name}</h4>
                        <p className="cart-item-price">
                          ¥{(item.price * item.quantity).toLocaleString()}
                        </p>
                        <div className="quantity-controls">
                          <button onClick={() => updateQuantity(item.id, -1)}>
                            <Minus size={14} />
                          </button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <button
                        className="remove-item-btn"
                        onClick={() => removeFromCart(item.id)}
                        title="削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cart-drawer-footer">
                  {subtotal < 5000 && (
                    <p className="free-shipping-bar">
                      あと <strong>¥{(5000 - subtotal).toLocaleString()}</strong> で送料無料！
                    </p>
                  )}
                  <div className="summary-row">
                    <span>小計</span>
                    <span>¥{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="summary-row">
                    <span>送料</span>
                    <span>{shippingFee === 0 ? '無料' : `¥${shippingFee}`}</span>
                  </div>
                  <div className="summary-row total">
                    <span>合計（税込）</span>
                    <span>¥{totalAmount.toLocaleString()}</span>
                  </div>

                  <button
                    className="primary-btn full-width"
                    onClick={() => {
                      setIsCartOpen(false);
                      setStep('shipping');
                    }}
                  >
                    レジに進む（お届け先入力） <ArrowRight size={18} />
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

// --- 注文内容サマリーコンポーネント ---
function OrderSummaryBox({
  cart,
  subtotal,
  shippingFee,
  totalAmount
}: {
  cart: CartItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
}) {
  return (
    <aside className="order-summary-card">
      <h3>ご注文内容</h3>
      <div className="summary-items">
        {cart.map((item) => (
          <div key={item.id} className="summary-item-row">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>¥{(item.price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="summary-divider" />
      <div className="summary-row">
        <span>小計</span>
        <span>¥{subtotal.toLocaleString()}</span>
      </div>
      <div className="summary-row">
        <span>送料（クール便）</span>
        <span>{shippingFee === 0 ? '無料' : `¥${shippingFee}`}</span>
      </div>
      <div className="summary-row total">
        <span>お支払い合計</span>
        <span>¥{totalAmount.toLocaleString()}</span>
      </div>
    </aside>
  );
}

export default App;
