export const ISHIP_API_URL = 'https://app.iship.cloud/api';
export const ISHIP_TOKEN = 'pk_xrs5zMeZgCJEgXT5Gxe3jVuwL0JSsVi1Q9pcvfVP4rJdXSuKldOH1B26iuRqOtJiEVH7WYRyql4wH0y29Edjam09ynFnIPRVSBsm';

export const iShipAPI = {
  createOrder: async (orderData) => {
    try {
      const response = await fetch(`${ISHIP_API_URL}/create_order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ISHIP_TOKEN}`
        },
        body: JSON.stringify(orderData)
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating iShip order:', error);
      throw error;
    }
  },
  
  // You can add check_price, cancel_order here later if needed
};
