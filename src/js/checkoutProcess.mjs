import { alertMessage, getLocalStorage } from "./utils.mjs"
import { checkOut } from "./externalServices.mjs"

function formDataToJSON(formElement) {
  const formData = new FormData(formElement),
    convertedJSON = {};

  formData.forEach(function (value, key) {
    convertedJSON[key] = value;
  });

  return convertedJSON;
}

function packageItems(items) {
  // convert the list of products from localStorage to the simpler form required for the checkout process
  return items.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity
  }));
}

export class CheckOutProcess {
  constructor(key, outputSelector){
    this.itemTotal = 0;
    this.shipping = 0;
    this.tax = 0;
    this.orderTotal = 0;
    this.key = key;
    this.outputSelector = outputSelector;
    this.list = getLocalStorage(key) || [];
    this.calculateItemSummary();
    this.calculateOrdertotal();
  }

  calculateItemSummary() {
    // calculate and display the total amount of the items in the cart, and the number of items.
    let subtotal = 0;
    let itemCount = 0;

    for (const item of this.list) {
      subtotal += item.FinalPrice * item.quantity;
      itemCount += item.quantity;
    }
    this.itemTotal = subtotal;
    this.displayOrderTotals(itemCount);
  }
  calculateOrdertotal() {
    const shippingPerItem = 2;
    const itemShipping = 10;

    const shippingCost = itemShipping + (this.list.length - 1) * shippingPerItem;
    this.shipping = shippingCost;
    this.tax = this.itemTotal * 0.06;
    // display the totals.
    const orderTotal = this.itemTotal + shippingCost + this.tax;
    this.orderTotal = orderTotal;
    this.displayOrderTotals();
  }
  displayOrderTotals() {
    // once the totals are all calculated display them in the order summary page
    const output = document.querySelector(this.outputSelector);

    const orderTemplate = `
    <legend>Order Summary</legend>
    <p>Item Total: $${this.itemTotal.toFixed(2)}</p>
    <p>Shipping: $${this.shipping}</p>
    <p>Tax: $${this.tax.toFixed(2)}</p>
    <p>Order Total: $${this.orderTotal.toFixed(2)}</p>
    `
    output.innerHTML = orderTemplate;
  }
  async checkout(form) {
    try {

      const jsonFormData = formDataToJSON(form);
      jsonFormData.orderDate = new Date();
      jsonFormData.items = packageItems(this.list);
      jsonFormData.orderTotal = this.orderTotal;
      jsonFormData.shipping = this.shipping;
      jsonFormData.tax = this.tax;
      console.log(jsonFormData)

      // make the post request to the server
      const response = await checkOut(jsonFormData);
      // console.log(response);
      const data = await response.json();
      console.log(data);

      // handle server response
      if (!response.ok) {
        const errorResponse = await response.json();
        const errorMessage = errorResponse.message;
        alertMessage(errorMessage);
        return;
      } 
      //redirect to success page
      window.location.href = "success.html"
      localStorage.clear();
      } catch (error) {
       // alert("Something went wrong: " + error)
      // alertMessage(error.message);
      let errorMessage = "An error occurred during checkout.";

      if (errorMessage in error) {
        errorMessage = error[errorMessage];
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alertMessage(errorMessage);
      };
  }
}