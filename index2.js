const rawData = require('./rawData.json')
const fs = require('fs')

const uniqueStoreList = []
const uniqueCustomerList = []

rawData.forEach(data => {
  if (!uniqueStoreList.includes(data.store)) {
    uniqueStoreList.push(data.store)
  }

  if (!uniqueCustomerList.includes(data.phone)) {
    uniqueCustomerList.push(data.phone)
  }
})

const fullList = []
const fullStoreAmountList = uniqueStoreList.map(store => { return { store: store, amount: 0 } })
uniqueStoreList.forEach(storelist => {
  fullList.push({
    store: storelist,
    oweTo: fullStoreAmountList.filter(list => list.store !== storelist),
    ownCredit: 0,
    customerList: uniqueCustomerList.map(customer => {return { customer, amount: 0 }})
  })
})

rawData.forEach(data => {
  const targetStoreIndex = fullList.findIndex(list => list.store === data.store)
  const customerIndex = fullList[targetStoreIndex].customerList.findIndex(cus => cus.customer === data.phone)

  if (data.collected) {
    fullList[targetStoreIndex].ownCredit += Number(data.collected)
    fullList[targetStoreIndex].customerList[customerIndex].amount += Number(data.collected)
  }

  if (data.redeemed) {
    let toRedeem = data.redeemed
    const balance = fullList[targetStoreIndex].customerList[customerIndex].amount - toRedeem
    if (balance < 0) {
      toRedeem -= fullList[targetStoreIndex].customerList[customerIndex].amount
      fullList[targetStoreIndex].ownCredit -= fullList[targetStoreIndex].customerList[customerIndex].amount
      fullList[targetStoreIndex].customerList[customerIndex].amount = 0
      borrowCreditFromOtherStore(fullList[targetStoreIndex], customerIndex, toRedeem)
    } else {
      fullList[targetStoreIndex].ownCredit -= data.redeemed
      fullList[targetStoreIndex].customerList[customerIndex].amount -= data.redeemed
    }
  }
})

function borrowCreditFromOtherStore (borrowerStoreObj, customerIndex, toBorrowAmount) {
  let toBorrow = toBorrowAmount
  for (const list of fullList) {
    if (list.store !== borrowerStoreObj.store) {
      const fullBorrow = list.customerList[customerIndex].amount > toBorrow
      if (fullBorrow) {
        list.ownCredit -= toBorrow
        const lenderOweIndex = borrowerStoreObj.oweTo.findIndex(owe => owe.store === list.store)
        borrowerStoreObj.oweTo[lenderOweIndex].amount += toBorrow
        list.customerList[customerIndex].amount -= toBorrow
        break
      } else {
        const lenderOweIndex = borrowerStoreObj.oweTo.findIndex(owe => owe.store === list.store)
        borrowerStoreObj.oweTo[lenderOweIndex].amount += list.customerList[customerIndex].amount
        toBorrow -= list.customerList[customerIndex].amount
        list.customerList[customerIndex].amount = 0
      }
    }
  }
}




fs.writeFileSync('./summary2.json', JSON.stringify(fullList))