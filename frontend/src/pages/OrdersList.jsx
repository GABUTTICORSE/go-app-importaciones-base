import { useEffect, useState } from 'react'
import {
    Eye,
    Pencil,
    Trash2,
    CalendarDays,
    ChevronDown,
    FilePlus,
    FileSearch,
    CheckCircle,
    CreditCard,
    Truck,
    Building2,
    Unlock,
    PackageCheck,
    Archive,
} from 'lucide-react'
import logoGC from '../assets/logo-gc.png'
import OMP from '../assets/OMP.png'
import BELL from '../assets/BELL.png'
import STILO from '../assets/STILO.png'
import EVOCORSE from '../assets/EVOCORSE.png'
import ORECA from '../assets/ORECA.png'
import ENDLESS from '../assets/ENDLESS.png'
import LIFELINE from '../assets/LIFELINE.png'
import FASTIME from '../assets/FASTIME.png'
import html2pdf from 'html2pdf.js'

const STATUS_OPTIONS = [
    'PEDIDO REALIZADO',
    'COTIZACIÓN',
    'APROBADO',
    'PAGADO',
    'EN TRÁNSITO',
    'ADUANA',
    'LIBERADO',
    'ENTREGADO',
    'CERRADO',
]

const SUPPLIER_LOGOS = {
  OMP,
  BELL,
  STILO,
  EVOCORSE,
  ORECA,
  ENDLESS,
  LIFELINE,
  FASTIME,
}

export default function OrdersList({ orders, onDeleteOrder, onUpdateOrder }) {
    const makeId = () =>
        crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const [orderToDelete, setOrderToDelete] = useState(null)
    const [orderToView, setOrderToView] = useState(null)
    const [orderToEdit, setOrderToEdit] = useState(null)
    const [productCatalog, setProductCatalog] = useState([])

    const sortedOrders = [...orders].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )

    function getSupplierLogo(supplier) {
    return SUPPLIER_LOGOS[supplier]
    }

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL || '/api'}/products`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('goapp_token')}`,
                },
            })
            .then((res) => res.json())
            .then((data) => setProductCatalog(data))
            .catch((error) => console.error('Error cargando productos', error))
    }, [])

    function formatDate(date) {
        return new Date(date).toLocaleDateString('es-CL', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        })
    }

    function formatDateTime(date) {
        return new Date(date).toLocaleString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    function formatCLP(value) {
        return `$${new Intl.NumberFormat('es-CL', {
            maximumFractionDigits: 0,
        }).format(value || 0)} CLP`
    }

    function getStatusIcon(status) {
        switch (status) {
            case 'PEDIDO REALIZADO':
                return <FilePlus size={16} />
            case 'COTIZACIÓN':
                return <FileSearch size={16} />
            case 'APROBADO':
                return <CheckCircle size={16} />
            case 'PAGADO':
                return <CreditCard size={16} />
            case 'EN TRÁNSITO':
                return <Truck size={16} />
            case 'ADUANA':
                return <Building2 size={16} />
            case 'LIBERADO':
                return <Unlock size={16} />
            case 'ENTREGADO':
                return <PackageCheck size={16} />
            case 'CERRADO':
                return <Archive size={16} />
            default:
                return null
        }
    }

    function getStatusClass(status) {
        switch (status) {
            case 'PEDIDO REALIZADO':
                return 'status-badge requested'
            case 'COTIZACIÓN':
                return 'status-badge quotation'
            case 'APROBADO':
                return 'status-badge approved'
            case 'PAGADO':
                return 'status-badge paid'
            case 'EN TRÁNSITO':
                return 'status-badge transit'
            case 'ADUANA':
                return 'status-badge customs'
            case 'LIBERADO':
                return 'status-badge released'
            case 'ENTREGADO':
                return 'status-badge delivered'
            case 'CERRADO':
                return 'status-badge closed'
            default:
                return 'status-badge'
        }
    }

    function getStatusHistory(order) {
        if (order.statusHistory?.length > 0) {
            return order.statusHistory
        }

        return [
            {
                status: order.status || 'PEDIDO REALIZADO',
                date: order.createdAt || new Date().toISOString(),
                note: 'Estado inicial',
            },
        ]
    }

    function calculateTotals(form, products = []) {
        const productsSubtotal = calculateProductsSubtotal(products)

        const productCLP =
            productsSubtotal * Number(form.exchangeRate || 0)

        const cif =
            productCLP +
            Number(form.freight || 0) +
            Number(form.insurance || 0)

        const totalCost =
            cif +
            Number(form.adValorem || 0) +
            Number(form.customs || 0) +
            Number(form.localExpenses || 0)

        return {
            productOriginValue: productsSubtotal,
            productCLP,
            cif,
            totalCost,
        }
    }

    function openEditModal(order) {
        setOrderToEdit({
            ...order,
            products:
                order.products?.length > 0
                    ? order.products
                    : [
                        {
                            id: makeId(),
                            code: '',
                            description: '',
                            quantity: 0,
                            unitPrice: 0,
                        },
                    ],
            form: {
                ...order.form,
                status: order.form?.status || order.status || 'PEDIDO REALIZADO',
            },
            statusHistory: getStatusHistory(order),
        })
    }

    function handleEditChange(e) {
        const { name, value } = e.target

        const numericFields = [
            'freight',
            'insurance',
            'customs',
            'localExpenses',
            'invoiceValue',
            'exchangeRate',
            'adValorem',
        ]

        setOrderToEdit((prev) => ({
            ...prev,
            form: {
                ...prev.form,
                [name]: numericFields.includes(name) ? Number(value) : value,
            },
            [name]: [
                'orderName',
                'supplier',
                'product',
                'incoterm',
                'orderDate',
                'status',
            ].includes(name)
                ? value
                : prev[name],
        }))
    }

    function saveEditedOrder() {
        const cleanProducts = orderToEdit.products.filter((product) => {
            return (
                product.code ||
                product.description ||
                Number(product.quantity) > 0 ||
                Number(product.unitPrice) > 0
            )
        })

        const updatedTotals = calculateTotals(orderToEdit.form, cleanProducts)

        const previousStatus =
            orders.find((order) => order.id === orderToEdit.id)?.status ||
            orderToEdit.status

        const newStatus = orderToEdit.form.status

        const statusHistory = [...getStatusHistory(orderToEdit)]

        if (previousStatus !== newStatus) {
            statusHistory.push({
                status: newStatus,
                date: new Date().toISOString(),
                note: `Cambio de ${previousStatus} a ${newStatus}`,
            })
        }

        const updatedOrder = {
            ...orderToEdit,
            orderDate: orderToEdit.form.orderDate,
            orderName: orderToEdit.form.orderName,
            rut: orderToEdit.form.rut,
            supplier: orderToEdit.form.supplier,
            product: orderToEdit.form.product,
            incoterm: orderToEdit.form.incoterm,
            status: newStatus,
            form: {
                ...orderToEdit.form,
                status: newStatus,
            },
            totals: updatedTotals,
            statusHistory,
            updatedAt: new Date().toISOString(),
            products: cleanProducts,
            form: {
                ...orderToEdit.form,
                status: newStatus,
                invoiceValue: calculateProductsSubtotal(cleanProducts),
            },
        }

        onUpdateOrder(updatedOrder)
        setOrderToEdit(null)
    }

    function getOrderProducts(order) {
        return order.products?.length > 0 ? order.products : []
    }

    function calculateProductsSubtotal(products = []) {
        return products.reduce((acc, product) => {
            return acc + Number(product.quantity || 0) * Number(product.unitPrice || 0)
        }, 0)
    }

    function handleEditProductChange(productId, field, value) {
        const numericFields = ['quantity', 'unitPrice']

        setOrderToEdit((prev) => ({
            ...prev,
            products: prev.products.map((product) => {
                if (product.id !== productId) return product

                if (field === 'code') {
                    const selectedProduct = productCatalog.find(
                        (item) => item.codigo === value
                    )

                    if (selectedProduct) {
                        return {
                            ...product,
                            code: selectedProduct.codigo,
                            description: selectedProduct.nombre_producto || '',
                        }
                    }
                }

                return {
                    ...product,
                    [field]: numericFields.includes(field) ? Number(value) : value,
                }
            }),
        }))
    }

    function addEditProductRow() {
        setOrderToEdit((prev) => ({
            ...prev,
            products: [
                ...(prev.products || []),
                {
                    id: makeId(),
                    code: '',
                    description: '',
                    quantity: 0,
                    unitPrice: 0,
                },
            ],
        }))
    }

    return (
        <section>
            <div className="orders-card">
                <div className="orders-header">
                    <h1>Lista de Órdenes</h1>

                    <div className="date-filter">
                        <span>{formatDate(new Date())}</span>
                        <CalendarDays size={20} />
                    </div>
                </div>

                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Nombre <ChevronDown size={16} /></th>
                            <th>Estado <ChevronDown size={16} /></th>
                            <th>Proveedor <ChevronDown size={16} /></th>
                            <th>Incoterm <ChevronDown size={16} /></th>
                            <th>N° Orden <ChevronDown size={16} /></th>
                            <th>Fecha de Solicitud <ChevronDown size={16} /></th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        {sortedOrders.length === 0 && (
                            <tr>
                                <td colSpan="7" className="empty-row">
                                    Aún no hay órdenes creadas.
                                </td>
                            </tr>
                        )}

                        {sortedOrders.map((order) => (
                            <tr key={order.id}>
                                <td>{order.orderName}</td>

                                <td>
                                    <span className={getStatusClass(order.status)}>
                                        {getStatusIcon(order.status)}
                                        {order.status}
                                    </span>
                                </td>

                                <td>
                                <img
                                    src={getSupplierLogo(order.supplier)}
                                    alt={order.supplier}
                                    className="supplier-logo"
                                />
                                </td>
                                <td>{order.incoterm}</td>
                                <td>{order.orderNumber}</td>
                                <td>{formatDate(order.orderDate)}</td>

                                <td>
                                    <div className="table-actions">
                                        <button title="Ver" onClick={() => setOrderToView(order)}>
                                            <Eye size={17} />
                                        </button>

                                        <button title="Editar" onClick={() => openEditModal(order)}>
                                            <Pencil size={17} />
                                        </button>

                                        <button
                                            title="Eliminar"
                                            onClick={() => setOrderToDelete(order)}
                                        >
                                            <Trash2 size={17} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="pagination">‹ 1 2 3 4 5 6 7 8 9 ›</div>
            </div>

            {orderToDelete && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h2>Eliminar orden</h2>
                        <p>
                            ¿Estás seguro de eliminar la orden{' '}
                            <strong>{orderToDelete.orderNumber}</strong>?
                        </p>

                        <div className="modal-actions">
                            <button
                                className="secondary-btn"
                                onClick={() => setOrderToDelete(null)}
                            >
                                Cancelar
                            </button>

                            <button
                                className="danger-btn"
                                onClick={() => {
                                    onDeleteOrder(orderToDelete.id)
                                    setOrderToDelete(null)
                                }}
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {orderToView && (
                <div className="modal-backdrop">
                    <div className="order-detail-modal">
                        <div className="modal-actions top-actions">
                            <button
                                className="secondary-btn"
                                onClick={() => setOrderToView(null)}
                            >
                                Cerrar
                            </button>

                            <button
                                className="primary-btn"
                                onClick={() => {
                                    const element = document.getElementById('order-pdf')

                                    html2pdf()
                                        .set({
                                            margin: 0,
                                            filename: `${orderToView.orderNumber}.pdf`,
                                            image: { type: 'jpeg', quality: 0.98 },
                                            html2canvas: { scale: 2 },
                                            jsPDF: {
                                                unit: 'mm',
                                                format: 'letter',
                                                orientation: 'portrait',
                                            },
                                        })
                                        .from(element)
                                        .save()
                                }}
                            >
                                Guardar PDF
                            </button>
                        </div>

                        <div id="order-pdf" className="letter-page">
                            <div className="letter-header">
                                <img src={logoGC} alt="Gabutti Corse" />

                                <div>
                                    <h2>Ficha de Orden</h2>
                                    <p>{orderToView.orderNumber}</p>
                                </div>
                            </div>

                            <hr />

                            <div className="letter-section">
                                <h3>Información general</h3>

                                <div className="letter-grid">
                                    <Info label="N° Orden" value={orderToView.orderNumber} />
                                    <Info label="Fecha" value={formatDate(orderToView.orderDate)} />
                                    <Info label="Nombre Orden" value={orderToView.orderName} />
                                    <Info label="RUT" value={orderToView.rut} />
                                    <div className="info-item">
                                        <span>Proveedor</span>

                                        <img
                                            src={getSupplierLogo(orderToView.supplier)}
                                            alt={orderToView.supplier}
                                            className="supplier-logo-large"
                                        />
                                        </div>
                                    <Info label="Producto" value={orderToView.product} />
                                    <Info label="Incoterm" value={orderToView.incoterm} />
                                    <Info
                                        label="Estado actual"
                                        value={
                                            <span className={getStatusClass(orderToView.status)}>
                                                {getStatusIcon(orderToView.status)}
                                                {orderToView.status}
                                            </span>
                                        }
                                    />
                                </div>
                            </div>

                            <div className="letter-section">
                                <h3>Historial de estados</h3>

                                <div className="status-timeline">
                                    {getStatusHistory(orderToView).map((item, index) => (
                                        <div className="status-timeline-item" key={`${item.status}-${index}`}>
                                            <div className="status-timeline-dot">
                                                {getStatusIcon(item.status)}
                                            </div>

                                            <div>
                                                <span className={getStatusClass(item.status)}>
                                                    {getStatusIcon(item.status)}
                                                    {item.status}
                                                </span>

                                                <p>{formatDateTime(item.date)}</p>

                                                {item.note && <small>{item.note}</small>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="letter-section">
                                <h3>Productos</h3>

                                <table className="order-products-view-table">
                                    <thead>
                                        <tr>
                                            <th>Código</th>
                                            <th>Descripción</th>
                                            <th>Cantidad</th>
                                            <th>Precio Unitario</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {getOrderProducts(orderToView).length === 0 && (
                                            <tr>
                                                <td colSpan="5">Sin productos asociados.</td>
                                            </tr>
                                        )}

                                        {getOrderProducts(orderToView).map((product) => {
                                            const rowTotal =
                                                Number(product.quantity || 0) * Number(product.unitPrice || 0)

                                            return (
                                                <tr key={product.id}>
                                                    <td>{product.code}</td>
                                                    <td>{product.description}</td>
                                                    <td>{product.quantity}</td>
                                                    <td>
                                                        {orderToView.form.currency || 'EUR'}{' '}
                                                        {new Intl.NumberFormat('es-CL').format(product.unitPrice || 0)}
                                                    </td>
                                                    <td>
                                                        <strong>
                                                            {orderToView.form.currency || 'EUR'}{' '}
                                                            {new Intl.NumberFormat('es-CL').format(rowTotal || 0)}
                                                        </strong>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="letter-section">
                                <h3>Costos</h3>

                                <div className="letter-grid">
                                    <Info
                                        label="Factura origen"
                                        value={`${orderToView.form.currency || 'EUR'} ${new Intl.NumberFormat('es-CL').format(orderToView.form.invoiceValue || 0)}`}
                                    />

                                    <Info
                                        label="Factura origen en CLP"
                                        value={formatCLP(orderToView.totals.productCLP)}
                                    />
                                    <Info
                                        label="Tipo cambio"
                                        value={formatCLP(orderToView.form.exchangeRate)}
                                    />
                                    <Info label="Flete" value={formatCLP(orderToView.form.freight)} />
                                    <Info label="Seguro" value={formatCLP(orderToView.form.insurance)} />
                                    <Info label="Ad Valorem" value={formatCLP(orderToView.form.adValorem)} />
                                    <Info label="Aduana" value={formatCLP(orderToView.form.customs)} />
                                    <Info
                                        label="Gastos locales"
                                        value={formatCLP(orderToView.form.localExpenses)}
                                    />
                                </div>
                            </div>

                            <div className="letter-total">
                                <span>Costo total estimado</span>
                                <strong>{formatCLP(orderToView.totals.totalCost)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {orderToEdit && (
                <div className="modal-backdrop">
                    <div className="edit-order-modal">
                        <div className="edit-modal-header">
                            <div>
                                <h2>Editar orden</h2>
                                <p>{orderToEdit.orderNumber}</p>
                            </div>

                            <button
                                className="secondary-btn"
                                onClick={() => setOrderToEdit(null)}
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="form-grid">
                            <FieldEdit
                                label="Fecha"
                                name="orderDate"
                                type="date"
                                value={orderToEdit.form.orderDate}
                                onChange={handleEditChange}
                            />

                            <div className="field">
                                <label>Estado de solicitud</label>
                                <select
                                    name="status"
                                    value={orderToEdit.form.status}
                                    onChange={handleEditChange}
                                >
                                    {STATUS_OPTIONS.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <FieldEdit
                                label="Nombre Orden"
                                name="orderName"
                                value={orderToEdit.form.orderName}
                                onChange={handleEditChange}
                            />

                            <FieldEdit
                                label="RUT"
                                name="rut"
                                value={orderToEdit.form.rut}
                                onChange={handleEditChange}
                            />

                            <div className="field">
                                <label>Proveedor</label>
                                <select
                                    name="supplier"
                                    value={orderToEdit.form.supplier}
                                    onChange={handleEditChange}
                                >
                                    <option value="">Seleccionar proveedor</option>
                                    <option value="OMP">OMP</option>
                                    <option value="BELL">BELL</option>
                                    <option value="STILO">STILO</option>
                                    <option value="EVOCORSE">EVOCORSE</option>
                                    <option value="ORECA">ORECA</option>
                                    <option value="ENDLESS">ENDLESS</option>
                                    <option value="LIFELINE">LIFELINE</option>
                                    <option value="FASTIME">FASTIME</option>
                                </select>
                            </div>

                            <FieldEdit
                                label="Producto"
                                name="product"
                                value={orderToEdit.form.product}
                                onChange={handleEditChange}
                            />

                            <div className="field">
                                <label>Incoterm</label>
                                <select
                                    name="incoterm"
                                    value={orderToEdit.form.incoterm}
                                    onChange={handleEditChange}
                                >
                                    <option>EXW</option>
                                    <option>FOB</option>
                                    <option>CIF</option>
                                    <option>DAP</option>
                                    <option>DDP</option>
                                    <option>COURIER</option>
                                </select>
                            </div>

                            <FieldEdit
                                label="Valor factura origen"
                                name="invoiceValue"
                                type="number"
                                value={orderToEdit.form.invoiceValue}
                                onChange={handleEditChange}
                            />

                            <FieldEdit
                                label="Tipo cambio → CLP"
                                name="exchangeRate"
                                type="number"
                                value={orderToEdit.form.exchangeRate}
                                onChange={handleEditChange}
                            />

                            <FieldEdit
                                label="Flete"
                                name="freight"
                                type="number"
                                value={orderToEdit.form.freight}
                                onChange={handleEditChange}
                            />

                            <FieldEdit
                                label="Seguro"
                                name="insurance"
                                type="number"
                                value={orderToEdit.form.insurance}
                                onChange={handleEditChange}
                            />

                            <FieldEdit
                                label="Ad Valorem"
                                name="adValorem"
                                type="number"
                                value={orderToEdit.form.adValorem}
                                onChange={handleEditChange}
                            />

                            <FieldEdit
                                label="Aduana"
                                name="customs"
                                type="number"
                                value={orderToEdit.form.customs}
                                onChange={handleEditChange}
                            />

                            <FieldEdit
                                label="Gastos locales"
                                name="localExpenses"
                                type="number"
                                value={orderToEdit.form.localExpenses}
                                onChange={handleEditChange}
                            />
                        </div>

                        <div className="edit-products-section">
                            <div className="products-section-header">
                                <div>
                                    <h3>Productos</h3>
                                    <p>Edita los productos asociados a esta orden</p>
                                </div>

                                <button
                                    type="button"
                                    className="add-product-btn"
                                    onClick={addEditProductRow}
                                >
                                    Agregar producto +
                                </button>
                            </div>

                            <div className="products-table-wrap">
                                <table className="order-products-table">
                                    <thead>
                                        <tr>
                                            <th>Código</th>
                                            <th>Descripción</th>
                                            <th>Cantidad</th>
                                            <th>Precio Unitario</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {orderToEdit.products.map((product) => {
                                            const rowTotal =
                                                Number(product.quantity || 0) *
                                                Number(product.unitPrice || 0)

                                            return (
                                                <tr key={product.id}>
                                                    <td>
                                                        <input
                                                            list={`edit-products-catalog-${product.id}`}
                                                            value={product.code}
                                                            onChange={(e) =>
                                                                handleEditProductChange(product.id, 'code', e.target.value)
                                                            }
                                                        />

                                                        <datalist id={`edit-products-catalog-${product.id}`}>
                                                            {productCatalog.map((catalogProduct) => (
                                                                <option
                                                                    key={catalogProduct._id}
                                                                    value={catalogProduct.codigo}
                                                                >
                                                                    {catalogProduct.nombre_producto}
                                                                </option>
                                                            ))}
                                                        </datalist>
                                                    </td>

                                                    <td>
                                                        <input
                                                            value={product.description}
                                                            onChange={(e) =>
                                                                handleEditProductChange(
                                                                    product.id,
                                                                    'description',
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    </td>

                                                    <td>
                                                        <input
                                                            type="number"
                                                            value={product.quantity}
                                                            onChange={(e) =>
                                                                handleEditProductChange(
                                                                    product.id,
                                                                    'quantity',
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    </td>

                                                    <td>
                                                        <input
                                                            type="number"
                                                            value={product.unitPrice}
                                                            onChange={(e) =>
                                                                handleEditProductChange(
                                                                    product.id,
                                                                    'unitPrice',
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    </td>

                                                    <td>
                                                        <strong>
                                                            {(orderToEdit.form.currency || 'EUR')}{' '}
                                                            {new Intl.NumberFormat('es-CL').format(rowTotal || 0)}
                                                        </strong>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="edit-summary">
                            <span>Costo total actualizado</span>
                            <strong>
                                {formatCLP(calculateTotals(orderToEdit.form, orderToEdit.products).totalCost)}
                            </strong>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="secondary-btn"
                                onClick={() => setOrderToEdit(null)}
                            >
                                Cancelar
                            </button>

                            <button className="primary-btn" onClick={saveEditedOrder}>
                                Guardar cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

function Info({ label, value }) {
    return (
        <div className="info-item">
            <span>{label}</span>
            <strong>{value || '-'}</strong>
        </div>
    )
}

function FieldEdit({ label, ...props }) {
    return (
        <div className="field">
            <label>{label}</label>
            <input {...props} />
        </div>
    )
}