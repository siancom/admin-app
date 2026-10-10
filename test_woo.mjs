const WOO_CFG = {
  key: "ck_6ecc49bb94d5c11308fb1c60ce30f220eb6e2302",
  sec: "cs_e0d7c58b3ec8093ba7aa5abc0b87186e7522d502"
};
const url = `https://irisnatures.com/wp-json/wc/v3/orders?per_page=10&consumer_key=${WOO_CFG.key}&consumer_secret=${WOO_CFG.sec}`;
fetch(url)
  .then(r => r.json())
  .then(data => {
    if(data && Array.isArray(data)) {
      data.forEach((o, i) => {
        let hasAddress = o.billing.first_name || o.shipping.first_name || o.billing.phone;
        console.log(`Order ${o.id} - Status: ${o.status} - Source: ${o.created_via} - Has Address: ${!!hasAddress}`);
      });
    }
  }).catch(e => console.error(e));
