import fetch from 'node-fetch';
const WOO_CFG = {
  key: "ck_6ecc49bb94d5c11308fb1c60ce30f220eb6e2302",
  sec: "cs_e0d7c58b3ec8093ba7aa5abc0b87186e7522d502"
};
const url = `https://irisnatures.com/wp-json/wc/v3/orders?status=processing&consumer_key=${WOO_CFG.key}&consumer_secret=${WOO_CFG.sec}`;
fetch(url)
  .then(r => r.json())
  .then(data => {
    if(data && data.length > 0) {
      const o = data[0];
      console.log(JSON.stringify({
        billing: o.billing,
        shipping: o.shipping,
        meta: o.meta_data.filter(m => m.key.includes('address') || m.key.includes('phone'))
      }, null, 2));
    } else {
      console.log("No orders");
    }
  }).catch(e => console.error(e));
