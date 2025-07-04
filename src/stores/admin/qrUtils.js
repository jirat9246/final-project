export const generateQRCode = (amount) => {
  const promptPayNumber = '0863536018' // หมายเลข PromptPay
  return `https://promptpay.io/${promptPayNumber}/${amount}`
}
