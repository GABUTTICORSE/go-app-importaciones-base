import { useMemo, useState } from 'react'

export default function UnitCosting({ orders }) {
  const [orderNumber, setOrderNumber] = useState('')

  const selectedOrder = orders.find(
    (order) => order.orderNumber === orderNumber
  )

  function formatCLP(value) {
    return `$${new Intl.NumberFormat('es-CL', {
      maximumFractionDigits: 0,
    }).format(value || 0)} CLP`
  }

  function formatPercent(value) {
    return `${new Intl.NumberFormat('es-CL', {
      maximumFractionDigits: 2,
    }).format(value || 0)}%`
  }

  const costingRows = useMemo(() => {
    if (!selectedOrder?.products?.length) return []

    const products = selectedOrder.products

    const subtotalOrigin = products.reduce((acc, product) => {
      return acc + Number(product.quantity || 0) * Number(product.unitPrice || 0)
    }, 0)

    const exchangeRate = Number(selectedOrder.form.exchangeRate || 0)

    const sharedCosts =
      Number(selectedOrder.form.freight || 0) +
      Number(selectedOrder.form.insurance || 0) +
      Number(selectedOrder.form.adValorem || 0) +
      Number(selectedOrder.form.customs || 0) +
      Number(selectedOrder.form.localExpenses || 0)

    return products.map((product) => {
      const quantity = Number(product.quantity || 0)
      const unitPrice = Number(product.unitPrice || 0)

      const lineOrigin = quantity * unitPrice
      const participation = subtotalOrigin > 0 ? lineOrigin / subtotalOrigin : 0
      const lineCLP = lineOrigin * exchangeRate
      const assignedImportCost = sharedCosts * participation
      const totalImportedCost = lineCLP + assignedImportCost
      const unitCostCLP = quantity > 0 ? totalImportedCost / quantity : 0

      return {
        ...product,
        lineOrigin,
        participation,
        lineCLP,
        assignedImportCost,
        totalImportedCost,
        unitCostCLP,
      }
    })
  }, [selectedOrder])

  return (
    <section>
      <div className="orders-card">
        <div className="orders-header">
          <div>
            <h1>Costeo Unitario</h1>
            <p>Calcula el costo real en Chile por producto importado</p>
          </div>
        </div>

        <div className="form-card">
          <div className="form-grid">
            <div className="field">
              <label>N° Orden</label>

              <input
                list="orders-list"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="0001-2026-OMP"
              />

              <datalist id="orders-list">
                {orders.map((order) => (
                  <option key={order.id} value={order.orderNumber}>
                    {order.orderName}
                  </option>
                ))}
              </datalist>
            </div>

            <div className="field">
              <label>Orden seleccionada</label>
              <input
                disabled
                value={selectedOrder?.orderName || 'Sin selección'}
              />
            </div>
          </div>
        </div>

        {selectedOrder && (
          <>
            <div className="unit-cost-summary">
              <div>
                <span>Proveedor</span>
                <strong>{selectedOrder.supplier}</strong>
              </div>

              <div>
                <span>Moneda origen</span>
                <strong>{selectedOrder.form.currency}</strong>
              </div>

              <div>
                <span>Tipo cambio</span>
                <strong>{formatCLP(selectedOrder.form.exchangeRate)}</strong>
              </div>

              <div>
                <span>Costo total orden</span>
                <strong>{formatCLP(selectedOrder.totals.totalCost)}</strong>
              </div>
            </div>

            <table className="orders-table unit-cost-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descripción</th>
                  <th>Cant.</th>
                  <th>Precio origen</th>
                  <th>Total origen</th>
                  <th>Participación</th>
                  <th>Costo importación asignado</th>
                  <th>Total importado CLP</th>
                  <th>Costo unitario Chile</th>
                </tr>
              </thead>

              <tbody>
                {costingRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.code}</td>
                    <td>{row.description}</td>
                    <td>{row.quantity}</td>
                    <td>
                      {selectedOrder.form.currency}{' '}
                      {new Intl.NumberFormat('es-CL').format(row.unitPrice)}
                    </td>
                    <td>
                      {selectedOrder.form.currency}{' '}
                      {new Intl.NumberFormat('es-CL').format(row.lineOrigin)}
                    </td>
                    <td>{formatPercent(row.participation * 100)}</td>
                    <td>{formatCLP(row.assignedImportCost)}</td>
                    <td>{formatCLP(row.totalImportedCost)}</td>
                    <td>
                      <strong>{formatCLP(row.unitCostCLP)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {!selectedOrder && (
          <div className="empty-row">
            Ingresa o selecciona una orden para calcular el costeo unitario.
          </div>
        )}
      </div>
    </section>
  )
}