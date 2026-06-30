import { useMemo, useState } from 'react'

export default function Inventory({ orders }) {
  const [search, setSearch] = useState('')

  function normalize(value) {
    return String(value || '').toLowerCase()
  }

  function formatCLP(value) {
    return `$${new Intl.NumberFormat('es-CL', {
      maximumFractionDigits: 0,
    }).format(value || 0)} CLP`
  }

  const inventoryItems = useMemo(() => {
    const closedOrders = orders.filter((order) => order.status === 'CERRADO')

    const inventoryMap = {}

    closedOrders.forEach((order) => {
      const products = order.products || []

      products.forEach((product) => {
        const key = product.code || product.description

        const quantity = Number(product.quantity || 0)
        const unitCost =
          quantity > 0
            ? Number(product.unitCostCLP || product.costCLP || 0)
            : 0

        const fallbackUnitCost =
          Number(product.unitPrice || 0) * Number(order.form?.exchangeRate || 0)

        const finalUnitCost = unitCost || fallbackUnitCost

        if (!inventoryMap[key]) {
          inventoryMap[key] = {
            code: product.code,
            name: product.description,
            size: product.size || product.talla || '',
            color: product.color || '',
            quantity: 0,
            totalCost: 0,
            orders: [],
          }
        }

        inventoryMap[key].quantity += quantity
        inventoryMap[key].totalCost += finalUnitCost * quantity
        inventoryMap[key].orders.push(order.orderNumber)
      })
    })

    return Object.values(inventoryMap).map((item) => ({
      ...item,
      unitCost:
        item.quantity > 0
          ? item.totalCost / item.quantity
          : 0,
    }))
  }, [orders])

  const filteredInventory = inventoryItems.filter((item) => {
    return (
      normalize(item.code).includes(normalize(search)) ||
      normalize(item.name).includes(normalize(search)) ||
      normalize(item.size).includes(normalize(search)) ||
      normalize(item.color).includes(normalize(search))
    )
  })

  return (
    <section>
      <div className="orders-card">
        <div className="orders-header">
          <div>
            <h1>Inventario</h1>
            <p>
              Productos disponibles desde órdenes cerradas.
            </p>
          </div>

          <div className="field inventory-search">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar código, producto, talla o color"
            />
          </div>
        </div>

        <div className="unit-cost-summary">
          <div>
            <span>Productos en inventario</span>
            <strong>{filteredInventory.length}</strong>
          </div>

          <div>
            <span>Unidades disponibles</span>
            <strong>
              {filteredInventory.reduce(
                (acc, item) => acc + Number(item.quantity || 0),
                0
              )}
            </strong>
          </div>

          <div>
            <span>Costo inventario</span>
            <strong>
              {formatCLP(
                filteredInventory.reduce(
                  (acc, item) => acc + Number(item.totalCost || 0),
                  0
                )
              )}
            </strong>
          </div>
        </div>

        <table className="orders-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Talla</th>
              <th>Color</th>
              <th>Cantidad</th>
              <th>Precio costo unitario</th>
              <th>Costo total</th>
              <th>Órdenes origen</th>
            </tr>
          </thead>

          <tbody>
            {filteredInventory.length === 0 && (
              <tr>
                <td colSpan="8" className="empty-row">
                  No hay inventario disponible. Cierra una orden para ingresar productos.
                </td>
              </tr>
            )}

            {filteredInventory.map((item) => (
              <tr key={item.code || item.name}>
                <td>{item.code}</td>
                <td>{item.name}</td>
                <td>{item.size || '-'}</td>
                <td>{item.color || '-'}</td>
                <td>{item.quantity}</td>
                <td>{formatCLP(item.unitCost)}</td>
                <td>{formatCLP(item.totalCost)}</td>
                <td>{[...new Set(item.orders)].join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}