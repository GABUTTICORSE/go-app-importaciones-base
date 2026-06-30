export function calculateImportCosts(input = {}) {
  const productValue = Number(input.productValue || 0);
  const freight = Number(input.freight || 0);
  const insurance = Number(input.insurance || 0);
  const localExpenses = Number(input.localExpenses || 0);
  const exchangeRate = Number(input.exchangeRate || 1);
  const cif = productValue + freight + insurance;
  const adValorem = cif * 0.06;
  const iva = (cif + adValorem) * 0.19;
  const taxes = adValorem + iva;
  const totalCost = productValue + freight + insurance + taxes + localExpenses;
  return { productValue, freight, insurance, localExpenses, exchangeRate, cif, adValorem, iva, taxes, totalCost, totalCostCLP: totalCost * exchangeRate };
}
