const API = import.meta.env.VITE_API_URL || '/api'
import { useEffect, useRef, useState } from 'react'
import './styles.css'
import {
  LayoutDashboard,
  PlusSquare,
  ClipboardList,
  Package,
  Settings,
  LogOut,
  Search,
  Boxes,
  Bell,
  StickyNote,
  Image,
  ExternalLink
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import CreateOrder from './pages/CreateOrder'
import OrdersList from './pages/OrdersList'
import Products from './pages/Products'
import UnitCosting from './pages/UnitCosting'
import Inventory from './pages/Inventory'
import Reminders from './pages/Reminders'
import logo from './assets/logoGO.png'
import carImage from './assets/go-layout.jpg'
import NewsTicker from './components/NewsTicker'
import BrandTicker from './components/BrandTicker'

const menuItems = [
  {
    label: 'Dashboard',
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: 'Crear orden',
    icon: <PlusSquare size={18} />,
  },
  {
    label: 'Ver órdenes',
    icon: <ClipboardList size={18} />,
  },
  {
    label: 'Costeo Unitario',
    icon: <Package size={18} />,
  },
  {
    label: 'Productos',
    icon: <Package size={18} />,
  },
  // {
  //   label: 'Clientes',
  //   icon: <Users size={18} />,
  // },
  {
    label: 'Inventario',
    icon: <Boxes size={18} />,
  },
  {
    label: 'Recordatorios',
    icon: <StickyNote size={18} />,
  },
  {
    label: 'Racing Force Dealers',
    icon: <Image size={18} />,
    external: true,
    url: 'https://racingforce.canto.com/v/USADealers/landing?viewIndex=0',
  },
  // {
  //   label: 'Configuración',
  //   icon: <Settings size={18} />,
  // },
]

export default function App() {
  const [logged, setLogged] = useState(false)
  const [activePage, setActivePage] = useState('Dashboard')
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [globalSearch, setGlobalSearch] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [reminders, setReminders] = useState([])
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupError, setSignupError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setLoginError(data.message || 'Email o contraseña incorrectos')
        return
      }

      localStorage.setItem('goapp_token', data.token)

      if (rememberMe) {
        localStorage.setItem('goapp_email', loginEmail)
      } else {
        localStorage.removeItem('goapp_email')
      }

      setCurrentUser(data.user)
      setLogged(true)
      setLoginError('')
      await loadOrders()
    } catch (error) {
      console.error('ERROR LOGIN FRONT:', error)
      setLoginError('No se pudo conectar con el servidor')
    }
  }

  async function handleSignup(e) {
    e.preventDefault()

    try {
      const token = localStorage.getItem('goapp_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSignupError(data.message || 'No se pudo crear la cuenta')
        return
      }

      setShowSignupModal(false)
      setLoginEmail(signupEmail)
      setSignupName('')
      setSignupEmail('')
      setSignupPassword('')
      setSignupError('')
      alert('Cuenta creada. Ahora puedes iniciar sesión.')
    } catch {
      setSignupError('No se pudo conectar con el servidor')
    }
  }

  // Llamada genérica a la API de operaciones con el token de sesión
  async function operationsRequest(path, options = {}) {
    const res = await fetch(`${API}/operations${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('goapp_token')}`,
        ...(options.headers || {}),
      },
    })

    if (res.status === 204) return null

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Error al comunicarse con el servidor')
    return data
  }

  // Busca el id de MongoDB de una orden a partir de su id interno
  function findMongoId(orderId) {
    const order = orders.find((o) => o.id === orderId || o._id === orderId)
    return order?._id
  }

  async function updateOrder(updatedOrder) {
    const mongoId = updatedOrder._id || findMongoId(updatedOrder.id)

    if (!mongoId) {
      alert('No se encontró la orden en el servidor. Recarga la página e inténtalo de nuevo.')
      return
    }

    try {
      const saved = await operationsRequest(`/${mongoId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedOrder),
      })

      setOrders((prev) =>
        prev.map((order) => (order._id === mongoId ? saved : order))
      )
    } catch (error) {
      console.error('Error actualizando orden:', error)
      alert(`No se pudo guardar el cambio: ${error.message}`)
    }
  }

  async function deleteOrder(orderId) {
    const mongoId = findMongoId(orderId)

    if (!mongoId) {
      alert('No se encontró la orden en el servidor. Recarga la página e inténtalo de nuevo.')
      return
    }

    try {
      await operationsRequest(`/${mongoId}`, { method: 'DELETE' })
      setOrders((prev) => prev.filter((order) => order._id !== mongoId))
    } catch (error) {
      console.error('Error eliminando orden:', error)
      alert(`No se pudo eliminar la orden: ${error.message}`)
    }
  }

  async function loadOrders() {
    const token = localStorage.getItem('goapp_token')

    if (!token) return

    try {
      const res = await fetch(`${API}/operations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('Error cargando órdenes:', data)
        return
      }

      setOrders(Array.isArray(data) ? data : data.operations || [])
    } catch (error) {
      console.error('Error conectando con operaciones:', error)
    }
  }

  useEffect(() => {
    const savedEmail = localStorage.getItem('goapp_email')

    if (savedEmail) {
      setLoginEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  function getUpcomingReminders() {
    const today = new Date()

    return reminders.filter((reminder) => {
      const alertDate = new Date(`${reminder.alertDate}T12:00:00`)
      const diffTime = alertDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      return diffDays >= 0 && diffDays <= 5
    })
  }

  const upcomingReminders = getUpcomingReminders()

  // Recordatorios guardados en el servidor
  const remindersLoaded = useRef(false)

  useEffect(() => {
    if (!logged) {
      remindersLoaded.current = false
      return
    }

    fetch(`${API}/reminders`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('goapp_token')}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((items) => {
        setReminders(Array.isArray(items) ? items : [])
        remindersLoaded.current = true
      })
      .catch((error) => console.error('Error cargando recordatorios:', error))
  }, [logged])

  useEffect(() => {
    // No guardar hasta haber cargado, para no borrar los recordatorios existentes
    if (!logged || !remindersLoaded.current) return

    const timer = setTimeout(() => {
      fetch(`${API}/reminders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('goapp_token')}`,
        },
        body: JSON.stringify({ items: reminders }),
      }).catch((error) => console.error('Error guardando recordatorios:', error))
    }, 500)

    return () => clearTimeout(timer)
  }, [reminders, logged])

  useEffect(() => {
    async function checkSession() {
      const token = localStorage.getItem('goapp_token')

      if (!token) return
      await loadOrders()
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()

        if (!res.ok) {
          localStorage.removeItem('goapp_token')
          return
        }

        setCurrentUser(data.user)
        setLogged(true)
        await loadOrders()
      } catch (error) {
        localStorage.removeItem('goapp_token')
      }
    }

    checkSession()
  }, [])

  useEffect(() => {
    if (logged) {
      loadOrders()
    }
  }, [logged])

  if (!logged) {
    return (
      <div className="login-page">
        <div className="login-left">
          <img className="logo" src={logo} alt="GO" />

          <h1 className="title">
            <span>Ciao,</span>
            Benvenuti!
          </h1>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-box active">
              <label>Email address</label>
              <input
                type="email"
                placeholder="name@mail.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>

            <div className="input-box">
              <label>Password</label>
              <input
                type="password"
                placeholder="****************"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            {loginError && <p className="login-error">{loginError}</p>}

            <div className="login-options">
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Recuérdame
              </label>

              <button
                type="button"
                className="link-button"
                onClick={() => setShowForgotModal(true)}
              >
                ¿Olvidaste la Contraseña?
              </button>
            </div>

            <div className="login-actions">
              <button type="submit" className="btn-login">Ingresar</button>
              <button
                type="button"
                className="btn-signup"
                onClick={() => setShowSignupModal(true)}
              >
                Crear Cuenta
              </button>
            </div>
          </form>

          <div className="follow">
            <span>Síguenos</span>
            <span>f</span>
            <span>x</span>
            <span>◎</span>
          </div>
        </div>

        <div className="login-right">
          <img src={carImage} alt="Gabutti Corse" />
        </div>

        {showForgotModal && (
          <div className="modal-backdrop">
            <div className="modal">
              <h2>Recuperar contraseña</h2>
              <p>
                Para este MVP, solicita al administrador reiniciar tu contraseña.
              </p>

              <div className="modal-actions">
                <button
                  className="primary-btn"
                  onClick={() => setShowForgotModal(false)}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {showSignupModal && (
          <div className="modal-backdrop">
            <div className="modal">
              <h2>Crear cuenta</h2>

              <form className="login-form" onSubmit={handleSignup}>
                <div className="input-box">
                  <label>Nombre</label>
                  <input
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Nombre"
                  />
                </div>

                <div className="input-box">
                  <label>Email</label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="correo@empresa.com"
                  />
                </div>

                <div className="input-box">
                  <label>Password</label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="********"
                  />
                </div>

                {signupError && <p className="login-error">{signupError}</p>}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setShowSignupModal(false)}
                  >
                    Cancelar
                  </button>

                  <button type="submit" className="primary-btn">
                    Crear cuenta
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <img className="sidebar-logo" src={logo} alt="GO" />

        <p className="menu-label">MAIN MENU</p>

        <nav>
          {menuItems.map((item) => {
            if (item.external) {
              return (
                <button
                  key={item.label}
                  className="menu-item"
                  onClick={() => window.open(item.url, '_blank')}
                >
                  <span className="menu-icon">
                    {item.icon}
                  </span>

                  {item.label}

                  <ExternalLink
                    size={14}
                    style={{ marginLeft: 'auto' }}
                  />
                </button>
              )
            }

            return (
              <button
                key={item.label}
                className={
                  activePage === item.label
                    ? 'menu-item active'
                    : 'menu-item'
                }
                onClick={() => setActivePage(item.label)}
              >
                <span className="menu-icon">
                  {item.icon}
                </span>

                {item.label}
              </button>
            )
          })}
        </nav>

        <button
          className="logout"
          onClick={() => {
            localStorage.removeItem('goapp_token')
            setLogged(false)
            setCurrentUser(null)
            setLoginPassword('')
            // Limpiar datos de la sesión para que no los vea el siguiente usuario
            setOrders([])
            setReminders([])
          }}
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </aside>

      <main className="main-content">
        <NewsTicker />
        <header className="topbar">

          <div className="search-box">
            <Search size={18} />
            <input
              placeholder="Search"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </div>

          <div className="topbar-right">

            <div className="notification-wrapper">
              <button
                className={
                  upcomingReminders.length > 0
                    ? 'notification-bell active'
                    : 'notification-bell'
                }
              >
                <Bell size={20} />

                {upcomingReminders.length > 0 && (
                  <span className="notification-dot"></span>
                )}
              </button>

              {upcomingReminders.length > 0 && (
                <div className="reminder-floating-badge">
                  <strong>Recordatorios próximos</strong>

                  {upcomingReminders.slice(0, 3).map((reminder) => (
                    <div key={reminder.id}>
                      <span>{reminder.title}</span>
                      <small>{reminder.alertDate}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="user-profile">
              <div className="user-avatar">
                {currentUser?.initials || 'GC'}
              </div>

              <div className="user-info">
                <strong>{currentUser?.name}</strong>
                <span>{currentUser?.email}</span>
              </div>
            </div>

          </div>

        </header>

        {activePage === 'Dashboard' && <Dashboard orders={orders} />}

        {activePage === 'Crear orden' && (
          <CreateOrder
            orders={orders}
            onSaveOrder={(newOrder) => {
              setOrders((prev) => [newOrder, ...prev])
              loadOrders()
            }}
          />
        )}

        {activePage === 'Ver órdenes' && (
          <OrdersList
            orders={orders}
            onDeleteOrder={deleteOrder}
            onUpdateOrder={updateOrder}
          />
        )}
        {activePage === 'Productos' && (
          <Products globalSearch={globalSearch} />
        )}
        {activePage === 'Costeo Unitario' && (
          <UnitCosting orders={orders} />
        )}
        {activePage === 'Inventario' && (
          <Inventory orders={orders} />
        )}
        {activePage === 'Recordatorios' && (
          <Reminders
            reminders={reminders}
            setReminders={setReminders}
          />
        )}
      </main>
      <BrandTicker />
    </div>
  )
}

function Dashboard({ orders }) {
  function formatCLP(value) {
    return `$${new Intl.NumberFormat('es-CL', {
      maximumFractionDigits: 0,
    }).format(value || 0)} CLP`
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  function getOrderDate(order) {
    return new Date(`${order.orderDate}T12:00:00`)
  }

  function isSameDay(dateA, dateB) {
    return dateA.toDateString() === dateB.toDateString()
  }

  function isSameWeek(date, now) {
    const firstDay = new Date(now)
    firstDay.setDate(now.getDate() - now.getDay())
    firstDay.setHours(0, 0, 0, 0)

    const lastDay = new Date(firstDay)
    lastDay.setDate(firstDay.getDate() + 6)
    lastDay.setHours(23, 59, 59, 999)

    return date >= firstDay && date <= lastDay
  }

  const now = new Date()

  const totalOrders = orders.length

  const activeOrders = orders.filter(
    (order) => order.status !== 'CERRADO' && order.status !== 'ENTREGADO'
  ).length

  const totalAmount = orders.reduce(
    (acc, order) => acc + Number(order.totals?.totalCost || 0),
    0
  )

  const dailyAmount = orders
    .filter((order) => isSameDay(getOrderDate(order), now))
    .reduce((acc, order) => acc + Number(order.totals?.totalCost || 0), 0)

  const weeklyAmount = orders
    .filter((order) => isSameWeek(getOrderDate(order), now))
    .reduce((acc, order) => acc + Number(order.totals?.totalCost || 0), 0)

  const monthlyAmount = orders
    .filter((order) => {
      const date = getOrderDate(order)
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    })
    .reduce((acc, order) => acc + Number(order.totals?.totalCost || 0), 0)

  const yearlyAmount = orders
    .filter((order) => getOrderDate(order).getFullYear() === now.getFullYear())
    .reduce((acc, order) => acc + Number(order.totals?.totalCost || 0), 0)

  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ]

  const monthlyData = months.map((month, index) => {
    const monthOrders = orders.filter((order) => {
      const date = getOrderDate(order)
      return date.getMonth() === index && date.getFullYear() === now.getFullYear()
    })

    return {
      month,
      ordenes: monthOrders.length,
      monto: monthOrders.reduce(
        (acc, order) => acc + Number(order.totals?.totalCost || 0),
        0
      ),
    }
  })

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  return (
    <section>
      <h1>Dashboard</h1>

      <div className="period-summary-card">
        <div className="period-item">
          <span>Diario</span>
          <strong>{formatCLP(dailyAmount)}</strong>
        </div>

        <div className="period-divider"></div>

        <div className="period-item">
          <span>Semanal</span>
          <strong>{formatCLP(weeklyAmount)}</strong>
        </div>

        <div className="period-divider"></div>

        <div className="period-item">
          <span>Mensual</span>
          <strong>{formatCLP(monthlyAmount)}</strong>
        </div>

        <div className="period-divider"></div>

        <div className="period-item">
          <span>Anual</span>
          <strong>{formatCLP(yearlyAmount)}</strong>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p>Total órdenes</p>
          <h2>{totalOrders}</h2>
          <small>Órdenes creadas</small>
        </div>

        <div className="stat-card">
          <p>Operaciones activas</p>
          <h2>{activeOrders}</h2>
          <small>Importaciones en curso</small>
        </div>

        <div className="stat-card">
          <p>Monto total histórico</p>
          <h2>{formatCLP(totalAmount)}</h2>
          <small>Total acumulado</small>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel large">
          <h3>Órdenes por mes</h3>

          <div className="chart-box">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="ordenes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel large">
          <h3>Montos de pedidos por mes</h3>

          <div className="chart-box">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${Number(value / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(value) => formatCLP(value)} />
                <Line type="monotone" dataKey="monto" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>Últimas órdenes</h3>

        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Orden</th>
              <th>Fecha</th>
              <th>Monto</th>
            </tr>
          </thead>

          <tbody>
            {recentOrders.length === 0 && (
              <tr>
                <td colSpan="4">Aún no hay órdenes creadas.</td>
              </tr>
            )}

            {recentOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.product || order.orderName}</td>
                <td>{order.orderNumber}</td>
                <td>{formatDate(order.orderDate)}</td>
                <td>{formatCLP(order.totals?.totalCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Placeholder({ title }) {
  return (
    <section>
      <h1>{title}</h1>
      <div className="panel">
        <p>Módulo listo para construir.</p>
      </div>
    </section>
  )
}