import { useEffect, useMemo, useState } from 'react'

const categoryTabs = [
  { key: 'all', label: 'Todos' },
  { key: 'footwear', label: 'Calzado' },
  { key: 'equipment', label: 'Equipamiento' },
  { key: 'apparel', label: 'Ropa' },
  { key: 'training', label: 'Entrenamiento' },
]

const categoryLabels = {
  footwear: 'Calzado',
  equipment: 'Equipamiento',
  apparel: 'Ropa',
  training: 'Entrenamiento',
}

const fallbackProducts = [
  {
    id: 'fallback-001',
    name: 'Balon Trionda Adidas',
    category: 'equipment',
    price: 95.0,
    stock: 24,
    image: '/products/equipment/Adidas-Trionda-Football.jpg',
  },
  {
    id: 'fallback-002',
    name: 'Botines Adidas Copa Pure',
    category: 'footwear',
    price: 210.0,
    stock: 18,
    image: '/products/footwear/Adidas-Copa-Pure.avif',
  },
  {
    id: 'fallback-003',
    name: 'Botines Puma Future 9 Ultimate',
    category: 'footwear',
    price: 227.0,
    stock: 21,
    image: '/products/footwear/Puma-Future-9-Ultimate.jpg',
  },
  {
    id: 'fallback-004',
    name: 'Camiseta Nike France',
    category: 'apparel',
    price: 75.0,
    stock: 30,
    image: '/products/apparel/Nike-France-Shirt.jpg',
  },
  {
    id: 'fallback-005',
    name: 'Guantes Puma Ultra Ultimate',
    category: 'equipment',
    price: 112.0,
    stock: 27,
    image: '/products/equipment/Puma-Ultra-Ultimate-Gloves.jpg',
  },
  {
    id: 'fallback-006',
    name: 'Conos de entrenamiento',
    category: 'training',
    price: 45.0,
    stock: 36,
    image: '/products/training/Training-Cones.jpg',
  },
  {
    id: 'fallback-007',
    name: 'Chaleco de entrenamiento',
    category: 'training',
    price: 53.5,
    stock: 33,
    image: '/products/training/Training-Vest.jpg',
  },
  {
    id: 'fallback-008',
    name: 'Medias Lux Grip',
    category: 'apparel',
    price: 83.5,
    stock: 28,
    image: '/products/apparel/Lux-Grip-Socks.jpg',
  },
]

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

function App() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [products, setProducts] = useState(fallbackProducts)
  const [cart, setCart] = useState({})
  const [customerSession, setCustomerSession] = useState(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginName, setLoginName] = useState('')
  const [loginError, setLoginError] = useState('')
  const [sessionMessage, setSessionMessage] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const loadProducts = async (signal) => {
    const normalizeProducts = (payload) => {
      if (Array.isArray(payload)) return payload
      if (payload && Array.isArray(payload.value)) return payload.value
      return []
    }

    const endpoints = ['/api/products', 'http://localhost:4000/api/products']

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, signal ? { signal } : undefined)
        if (!response.ok) {
          continue
        }

        const result = await response.json()
        const normalized = normalizeProducts(result)
        if (normalized.length > 0) {
          setProducts(normalized)
          return normalized
        }
      } catch {
        // Try the next endpoint.
      }
    }

    return []
  }

  useEffect(() => {
    const controller = new AbortController()

    loadProducts(controller.signal)

    return () => {
      controller.abort()
    }
  }, [])

  const currentCustomer = customerSession?.customer || null

  const visibleProducts = useMemo(() => {
    if (activeCategory === 'all') {
      return products
    }

    return products.filter((item) => item.category === activeCategory)
  }, [activeCategory])

  const productMap = useMemo(() => new Map(products.map((item) => [item.id, item])), [products])

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, quantity]) => {
        const product = productMap.get(id)
        return product ? { ...product, quantity } : null
      })
      .filter(Boolean)
  }, [cart, productMap])

  const orderHistory = customerSession?.orders || []

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)
  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)

  useEffect(() => {
    if (!currentCustomer) {
      return undefined
    }

    const controller = new AbortController()

    const persistCart = async () => {
      try {
        await fetch(`/api/cart/${currentCustomer.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: cartItems.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
            })),
          }),
          signal: controller.signal,
        })
      } catch {
        // Local cart remains usable even if persistence fails momentarily.
      }
    }

    persistCart()

    return () => {
      controller.abort()
    }
  }, [cartItems, currentCustomer])

  const handleAddToCart = (product) => {
    const availableStock = Number(product.stock || 0)
    if (availableStock <= 0) {
      setSessionMessage(`${product.name} no tiene stock disponible.`)
      return
    }

    setCart((prev) => ({
      ...prev,
      [product.id]: Math.min((prev[product.id] || 0) + 1, availableStock),
    }))
    setSessionMessage(`${product.name} agregado al carrito.`)
  }

  const updateQuantity = (id, nextQuantity) => {
    setCart((prev) => {
      const product = productMap.get(id)
      const stock = Number(product?.stock || 0)
      const safeQuantity = stock > 0 ? Math.min(nextQuantity, stock) : nextQuantity

      if (safeQuantity <= 0) {
        const next = { ...prev }
        delete next[id]
        return next
      }

      return {
        ...prev,
        [id]: safeQuantity,
      }
    })
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setIsLoggingIn(true)
    setLoginError('')
    setSessionMessage('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail,
          name: loginName,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo iniciar sesión')
      }

      setCustomerSession(data)
      setCart(
        Object.fromEntries(
          (data.cart?.items || []).map((item) => [String(item.productId), Number(item.quantity) || 1]),
        ),
      )
      setLoginEmail(data.customer?.email || loginEmail)
      setLoginName(data.customer?.name || loginName)
      localStorage.setItem('ecommerce:lastEmail', data.customer?.email || loginEmail)
      setSessionMessage(data.created ? 'Usuario creado e iniciado' : 'Sesión recuperada con el usuario existente')
      setIsCartOpen(true)
    } catch (error) {
      setLoginError(error.message)
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleCheckout = async () => {
    if (!currentCustomer) {
      setSessionMessage('Inicia sesión con tu email para guardar la compra.')
      return
    }

    if (cartItems.length === 0) {
      setSessionMessage('El carrito está vacío.')
      return
    }

    setIsCheckingOut(true)
    setSessionMessage('')

    try {
      const response = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: currentCustomer.id,
          items: cartItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo completar la compra')
      }

      setCart({})
      setCustomerSession((prev) =>
        prev
          ? {
              ...prev,
              orders: data.orders || prev.orders,
              cart: data.cart || null,
            }
          : prev,
      )
      await loadProducts()
      setSessionMessage('Compra registrada y stock actualizado.')
    } catch (error) {
      setSessionMessage(error.message)
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">PITCH</div>
        <nav className="main-nav" aria-label="Navegación principal">
          <a href="#">Tienda</a>
          <a href="#">Colecciones</a>
          <a href="#">Nosotros</a>
        </nav>
        <div className="top-actions">
          <button type="button" className="icon-btn" aria-label="Buscar">
            ⌕
          </button>
          <button
            type="button"
            className="icon-btn cart-trigger"
            aria-label="Abrir carrito"
            onClick={() => setIsCartOpen(true)}
          >
            🛒
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </button>
        </div>
      </header>

      <main>
        <section className="hero-block">
          <h1>Equipamiento premium de fútbol</h1>
          <p>
            Mejora tu juego con equipamiento de nivel profesional. Una colección
            seleccionada de botines, pelotas y ropa deportiva.
          </p>
        </section>

        <section className="filters" aria-label="Acceso de usuario">
          <form onSubmit={handleLogin} className="login-panel">
            <input
              type="email"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              placeholder="Email"
              required
            />
            <input
              type="text"
              value={loginName}
              onChange={(event) => setLoginName(event.target.value)}
              placeholder="Nombre opcional"
            />
            <button type="submit" className="chip" disabled={isLoggingIn}>
              {isLoggingIn ? 'Ingresando...' : 'Entrar'}
            </button>
          </form>
          <div className="session-summary">
            {currentCustomer ? (
              <>
                <strong>{currentCustomer.name}</strong>
                <span>{currentCustomer.email}</span>
                <small>
                  Sesiones: {currentCustomer.login_count ?? 0} | Último acceso:{' '}
                  {currentCustomer.last_login_at
                    ? new Date(currentCustomer.last_login_at).toLocaleString('es-BO')
                    : 'primera vez'}
                </small>
              </>
            ) : (
              <>
                <strong>Sesión local</strong>
                <span>Ingresa con tu email para guardar compras e historial.</span>
              </>
            )}
          </div>
        </section>

        {(loginError || sessionMessage) && (
          <section className="session-message" aria-live="polite">
            {loginError || sessionMessage}
          </section>
        )}

        <section className="filters" aria-label="Categorías de productos">
          {categoryTabs.map((tab) => (
            <button
              type="button"
              key={tab.key}
              className={tab.key === activeCategory ? 'chip active' : 'chip'}
              onClick={() => setActiveCategory(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </section>

        <section className="product-grid" aria-label="Productos">
          {visibleProducts.map((product) => (
            <article
              key={product.id}
              className="card"
              role="button"
              tabIndex={0}
              onClick={() => handleAddToCart(product)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handleAddToCart(product)
                }
              }}
            >
              <img src={product.image} alt={product.name} loading="lazy" />
              <div className="card-info">
                <span>{categoryLabels[product.category] ?? product.category}</span>
                <h2>{product.name}</h2>
                <small>Stock: {Number(product.stock || 0)}</small>
                <div className="card-bottom">
                  <strong>{formatCurrency(product.price)}</strong>
                  <button
                    type="button"
                    className="add-btn"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleAddToCart(product)
                    }}
                    aria-label={`Agregar ${product.name} al carrito`}
                    disabled={Number(product.stock || 0) <= 0}
                  >
                    +
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        {currentCustomer && (
          <section className="history-block" aria-label="Historial de compras">
            <h2>Historial de compras</h2>
            {orderHistory.length === 0 ? (
              <p>No hay compras registradas todavía.</p>
            ) : (
              orderHistory.map((order) => (
                <article key={order.id} className="history-item">
                  <div className="history-head">
                    <strong>{new Date(order.created_at).toLocaleString('es-BO')}</strong>
                    <span>{order.status}</span>
                  </div>
                  <div className="history-meta">
                    <span>Items: {order.item_count}</span>
                    <span>Total: {formatCurrency(order.total || 0)}</span>
                  </div>
                  <ul>
                    {order.items.map((item) => (
                      <li key={`${order.id}-${item.id || item.product_id}`}>{item.product_name} x {item.quantity}</li>
                    ))}
                  </ul>
                </article>
              ))
            )}
          </section>
        )}
      </main>

      <div
        className={isCartOpen ? 'overlay active' : 'overlay'}
        onClick={() => setIsCartOpen(false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setIsCartOpen(false)
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Cerrar carrito"
      />

      <aside className={isCartOpen ? 'cart-drawer open' : 'cart-drawer'}>
        <div className="cart-header">
          <h3>Carrito</h3>
          <button
            type="button"
            className="icon-btn"
            aria-label="Cerrar carrito"
            onClick={() => setIsCartOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="cart-content">
          {cartItems.length === 0 ? (
            <p className="empty">Tu carrito está vacío.</p>
          ) : (
            cartItems.map((item) => (
              <article key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} loading="lazy" />
                <div className="cart-item-info">
                  <div className="cart-item-top">
                    <strong>{item.name}</strong>
                    <strong>{formatCurrency(item.price * item.quantity)}</strong>
                  </div>
                  <span>{formatCurrency(item.price)}</span>
                  <div className="qty-controls">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <footer className="cart-footer">
          <div>
            <span>Total</span>
            <strong>{formatCurrency(cartTotal)}</strong>
          </div>
          <button
            type="button"
            className="checkout-btn"
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || isCheckingOut}
          >
            {isCheckingOut ? 'Procesando...' : 'Pagar'}
          </button>
        </footer>
      </aside>
    </div>
  )
}

export default App
