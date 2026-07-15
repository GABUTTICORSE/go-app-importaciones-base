import { useEffect, useMemo, useState } from 'react'

const makeId = () =>
  crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function createEmptyProductRow() {
    return {
        id: makeId(),
        code: '',
        description: '',
        quantity: 0,
        unitPrice: 0,
    }
}

function createDefaultProducts() {
    return Array.from({ length: 5 }, () => createEmptyProductRow())
}

const initialForm = {
    orderDate: new Date().toISOString().split('T')[0],
    orderName: '',
    supplier: '',
    product: '',
    invoiceFile: null,
    status: 'PEDIDO REALIZADO',
    incoterm: 'EXW',
    currency: 'EUR',
    exchangeRate: 0,
    freight: 0,
    insurance: 0,
    customs: 0,
    localExpenses: 0,
    adValorem: 0,
    invoiceValue: 0,
}

const SUPPLIER_CODES = {
    OMP: 'OMP',
    BELL: 'BELL',
    STILO: 'STILO',
    EVOCORSE: 'EVOCORSE',
    ORECA: 'ORECA',
    ENDLESS: 'ENDLESS',
    LIFELINE: 'LIFELINE',
    FASTIME: 'FASTIME',
}

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

export default function CreateOrder({ onSaveOrder, orders }) {
    const [form, setForm] = useState(initialForm)
    const [orderProducts, setOrderProducts] = useState(createDefaultProducts)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [productCatalog, setProductCatalog] = useState([])

    const currentYear = new Date().getFullYear()
    const nextSequence = String(orders.length + 1).padStart(4, '0')

    const generatedOrderNumber = form.supplier
        ? `${nextSequence}-${currentYear}-${SUPPLIER_CODES[form.supplier]}`
        : `${nextSequence}-${currentYear}`

    useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || '/api'}/products`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('goapp_token')}`,
        },
    })
        .then((res) => {
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`)
            }

            return res.json()
        })
        .then((data) => setProductCatalog(data))
        .catch((error) =>
            console.error('Error cargando productos:', error)
        )
}, [])


    useEffect(() => {
    async function getExchangeRate() {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL || '/api'}/exchange-rate/${form.currency}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('goapp_token')}`,
                    },
                }
            )

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`)
            }

            const data = await res.json()
            console.log('Exchange rate response:', data)

            setForm((prev) => ({
                ...prev,
                exchangeRate: Math.round(data.rate ?? 0),
            }))
        } catch (error) {
            console.error('Error obteniendo tipo de cambio:', error)
        }
    }

    getExchangeRate()
}, [form.currency])

    function handleChange(e) {
        const { name, value, files, type } = e.target

        const numericFields = [
            'freight',
            'insurance',
            'customs',
            'localExpenses',
            'invoiceValue',
            'exchangeRate',
            'adValorem',
        ]

        setForm({
            ...form,
            [name]:
                type === 'file'
                    ? files[0]
                    : numericFields.includes(name)
                        ? Number(value)
                        : value,
        })
    }

    function handleProductChange(productId, field, value) {
        const numericFields = ['quantity', 'unitPrice']

        setOrderProducts((prev) =>
            prev.map((product) => {
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
            })
        )
    }

    function addProductRow() {
        setOrderProducts((prev) => [...prev, createEmptyProductRow()])
    }

    const productsSubtotal = useMemo(() => {
        return orderProducts.reduce((acc, product) => {
            return acc + Number(product.quantity || 0) * Number(product.unitPrice || 0)
        }, 0)
    }, [orderProducts])

    const totals = useMemo(() => {
        const productCLP = productsSubtotal * form.exchangeRate
        const cif = productCLP + form.freight + form.insurance

        const totalCost =
            productCLP + form.freight + form.insurance + form.adValorem + form.customs + form.localExpenses

        return {
            productOriginValue: productsSubtotal,
            productCLP,
            cif,
            totalCost,
        }
    }, [form, productsSubtotal])

    function formatCLP(value) {
        return `$${new Intl.NumberFormat('es-CL', {
            maximumFractionDigits: 0,
        }).format(value || 0)} CLP`
    }

    function formatCurrency(value) {
        return `${form.currency} ${new Intl.NumberFormat('es-CL', {
            maximumFractionDigits: 2,
        }).format(value || 0)}`
    }

    async function handleSubmit(e) {
        e?.preventDefault();
        console.log('CLICK GUARDAR ORDEN');

    const cleanProducts = orderProducts.filter((product) => {
        return (
            product.code ||
            product.description ||
            Number(product.quantity) > 0 ||
            Number(product.unitPrice) > 0
        );
    });

    const newOrder = {
        id: makeId(),
        orderNumber: generatedOrderNumber,
        orderDate: form.orderDate,
        orderName: form.orderName,
        supplier: form.supplier,
        product: form.product,
        products: cleanProducts,
        incoterm: form.incoterm,
        status: form.status,
        currency: form.currency,
        exchangeRate: form.exchangeRate,
        statusHistory: [
            {
                status: form.status,
                date: new Date().toISOString(),
                note: 'Estado inicial',
            },
        ],
        createdAt: new Date().toISOString(),
        totals,
        form: {
            ...form,
            invoiceValue: productsSubtotal,
        },
    };

    try {
        const API = import.meta.env.VITE_API_URL || '/api';

        const response = await fetch(`${API}/operations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('goapp_token')}`,
            },
            body: JSON.stringify(newOrder),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.message || 'No se pudo guardar la orden');
        }

        onSaveOrder(data);
        setShowSuccessModal(true);
    } catch (error) {
        console.error('ERROR CREATE ORDER:', error);
        alert(error.message || 'Error al guardar la orden');
    }
}

    return (
        <section>
            <div className="page-header">
                <div>
                    <h1>Crear orden</h1>
                    <p>Calculadora de importación MVP</p>
                </div>

                <button type="button" className="primary-btn" onClick={handleSubmit}>
                    Guardar orden
                </button>
            </div>

            <div className="order-layout">
                <form id="order-form" className="order-form" onSubmit={handleSubmit}>
                    <div className="form-card">
                        <h3>Información general</h3>

                        <div className="form-grid">
                            <div className="field">
                                <label>N° Orden</label>
                                <input value={generatedOrderNumber} disabled />
                            </div>

                            <Field
                                label="Fecha"
                                name="orderDate"
                                type="date"
                                value={form.orderDate}
                                onChange={handleChange}
                            />

                            <Field
                                label="Nombre Orden"
                                name="orderName"
                                value={form.orderName}
                                onChange={handleChange}
                                placeholder="Pedido Pastillas Endless"
                            />

                            <div className="field">
                                <label>Proveedor</label>
                                <select
                                    name="supplier"
                                    value={form.supplier}
                                    onChange={handleChange}
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

                            <div className="field">
                                <label>Estado de solicitud</label>
                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                >
                                    {STATUS_OPTIONS.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Field
                                label="Producto general"
                                name="product"
                                value={form.product}
                                onChange={handleChange}
                                placeholder="Ej: Pastillas de freno"
                            />

                            <Field
                                label="Adjuntar factura"
                                name="invoiceFile"
                                type="file"
                                onChange={handleChange}
                            />

                            <div className="field">
                                <label>Incoterm</label>
                                <select
                                    name="incoterm"
                                    value={form.incoterm}
                                    onChange={handleChange}
                                >
                                    <option>EXW</option>
                                    <option>FOB</option>
                                    <option>CIF</option>
                                    <option>COURIER</option>
                                </select>
                            </div>

                            <div className="field">
                                <label>Moneda factura origen</label>
                                <select
                                    name="currency"
                                    value={form.currency}
                                    onChange={handleChange}
                                >
                                    <option value="EUR">Euro</option>
                                    <option value="USD">Dólar</option>
                                    <option value="GBP">Libra Esterlina</option>
                                </select>
                            </div>

                            <Field
                                label={`Valor ${form.currency} → CLP`}
                                name="exchangeRate"
                                type="number"
                                value={form.exchangeRate}
                                onChange={handleChange}
                                placeholder="$0"
                            />
                        </div>
                    </div>

                    <div className="form-card">
                        <div className="products-section-header">
                            <div>
                                <h3>Productos</h3>
                                <p>Agrega los productos asociados a esta orden</p>
                            </div>

                            <button
                                type="button"
                                className="add-product-btn"
                                onClick={addProductRow}
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
                                    {orderProducts.map((product) => {
                                        const rowTotal =
                                            Number(product.quantity || 0) *
                                            Number(product.unitPrice || 0)

                                        return (
                                            <tr key={product.id}>
                                                <td>
                                                    <input
                                                        list={`products-catalog-${product.id}`}
                                                        value={product.code}
                                                        onChange={(e) =>
                                                            handleProductChange(product.id, 'code', e.target.value)
                                                        }
                                                        placeholder="Código"
                                                    />

                                                    <datalist id={`products-catalog-${product.id}`}>
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
                                                            handleProductChange(
                                                                product.id,
                                                                'description',
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Descripción"
                                                    />
                                                </td>

                                                <td>
                                                    <input
                                                        type="number"
                                                        value={product.quantity}
                                                        onChange={(e) =>
                                                            handleProductChange(
                                                                product.id,
                                                                'quantity',
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="0"
                                                    />
                                                </td>

                                                <td>
                                                    <input
                                                        type="number"
                                                        value={product.unitPrice}
                                                        onChange={(e) =>
                                                            handleProductChange(
                                                                product.id,
                                                                'unitPrice',
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="0"
                                                    />
                                                </td>

                                                <td>
                                                    <strong>{formatCurrency(rowTotal)}</strong>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="products-subtotal">
                            <span>Subtotal productos</span>
                            <strong>{formatCurrency(productsSubtotal)}</strong>
                        </div>
                    </div>

                    <div className="form-card">
                        <h3>Costos</h3>

                        <div className="form-grid">
                            <Field
                                label="Flete CLP"
                                name="freight"
                                type="number"
                                value={form.freight}
                                onChange={handleChange}
                            />

                            <Field
                                label="Seguro CLP"
                                name="insurance"
                                type="number"
                                value={form.insurance}
                                onChange={handleChange}
                            />

                            <Field
                                label="Aduana CLP"
                                name="customs"
                                type="number"
                                value={form.customs}
                                onChange={handleChange}
                            />

                            <Field
                                label="Gastos locales CLP"
                                name="localExpenses"
                                type="number"
                                value={form.localExpenses}
                                onChange={handleChange}
                            />

                            <Field
                                label="Ad Valorem CLP"
                                name="adValorem"
                                type="number"
                                value={form.adValorem}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </form>

                <aside className="summary-card">
                    <h3>Resumen cálculo</h3>

                    <SummaryRow
                        label={`Subtotal productos ${form.currency}`}
                        value={formatCurrency(productsSubtotal)}
                    />

                    <SummaryRow
                        label={`Tipo cambio ${form.currency} → CLP`}
                        value={formatCLP(form.exchangeRate)}
                    />

                    <SummaryRow
                        label="Producto CLP"
                        value={formatCLP(totals.productCLP)}
                    />

                    <SummaryRow label="Flete CLP" value={formatCLP(form.freight)} />
                    <SummaryRow label="CIF" value={formatCLP(totals.cif)} />
                    <SummaryRow label="Ad Valorem" value={formatCLP(form.adValorem)} />
                    <SummaryRow label="Aduana" value={formatCLP(form.customs)} />
                    <SummaryRow
                        label="Gastos locales"
                        value={formatCLP(form.localExpenses)}
                    />

                    <div className="summary-total">
                        <span>Costo Total</span>
                        <strong>{formatCLP(totals.totalCost)}</strong>
                    </div>
                </aside>
            </div>

            {showSuccessModal && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h2>Orden guardada</h2>

                        <p>
                            Has guardado satisfactoriamente tu orden.
                            Revísala o edítala en Ver órdenes.
                        </p>

                        <div className="modal-actions">
                            <button
                                className="primary-btn"
                                onClick={() => setShowSuccessModal(false)}
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

function Field({ label, ...props }) {
    return (
        <div className="field">
            <label>{label}</label>
            <input {...props} />
        </div>
    )
}

function SummaryRow({ label, value }) {
    return (
        <div className="summary-row">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    )
}