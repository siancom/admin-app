import React from 'react';
import { renderToString } from 'react-dom/server';
import EmployeeDashboard from './src/components/EmployeeDashboard';

try {
  const html = renderToString(React.createElement(EmployeeDashboard, {
    employees: [{ id: '1', name: 'Test', branch: 'เฉวง' }]
  }));
  console.log('SUCCESS');
} catch (e) {
  console.error('ERROR', e);
}
