export function logStep(message: string) {
  console.log(`\n====================================`);
  console.log(message);
  console.log(`====================================`);
}

export function success(message: string) {
  console.log(`✅ ${message}`);
}

export function error(message: string) {
  console.log(`❌ ${message}`);
}

export function warning(message: string) {
  console.log(`⚠️ ${message}`);
}