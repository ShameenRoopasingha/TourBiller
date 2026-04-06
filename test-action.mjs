/* eslint-disable @typescript-eslint/no-require-imports */
const { createBill } = require('./src/lib/actions');
const { FormData } = require('formdata-node');

async function test() {
  const formData = new FormData();
  formData.append('vehicleNo', 'TEST-V1');
  formData.append('customerName', 'Test Customer');
  formData.append('route', 'Test Route');
  formData.append('startMeter', '100');
  formData.append('endMeter', '200');
  formData.append('hireRate', '50');
  formData.append('waitingCharge', '0');
  formData.append('gatePass', '0');
  formData.append('packageCharge', '0');
  formData.append('allowedKm', '100');
  formData.append('extraHours', '0');
  formData.append('extraHourRate', '0');
  formData.append('extraKm', '0');
  formData.append('accommodationCharge', '500');
  formData.append('mealsCharge', '200');
  formData.append('activitiesCharge', '100');
  formData.append('otherCostsCharge', '50');
  formData.append('scheduledDays', '1');

  try {
    const result = await createBill(formData);
    console.log('Result:', result);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
