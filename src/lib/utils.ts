import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatStockDisplay(stock: number, boxesPerCarton: number, unit: string) {
  if (!boxesPerCarton || boxesPerCarton <= 1) {
    return `${stock} ${unit}${stock > 1 ? 's' : ''}`;
  }

  const cartons = Math.floor(stock / boxesPerCarton);
  const loose = stock % boxesPerCarton;

  let display = '';
  
  if (cartons > 0) {
    display += `${cartons} carton${cartons > 1 ? 's' : ''}`;
  }

  if (loose > 0) {
    if (display) display += ' et ';
    display += `${loose} ${unit}${loose > 1 ? 's' : ''}`;
  }

  if (!display) {
    display = `0 ${unit}`;
  }

  return `${display} (${stock} ${unit}${stock > 1 ? 's' : ''} au total)`;
}
