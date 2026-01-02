export interface PaymentPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // in kobo (smallest currency unit for Naira)
  description: string;
}

export class PaymentService {
  // Available credit packages
  static readonly CREDIT_PACKAGES: PaymentPackage[] = [
    {
      id: 'package_4_credits',
      name: '4 Credits',
      credits: 4,
      price: 50000, // ₦500 in kobo
      description: 'Starter pack to try premium tools'
    },
    {
      id: 'package_10_credits',
      name: '10 Credits',
      credits: 10,
      price: 100000, // ₦1,000 in kobo
      description: 'Great for trying out our premium career tools'
    },
    {
      id: 'package_30_credits',
      name: '30 Credits',
      credits: 30,
      price: 250000, // ₦2,500 in kobo
      description: 'Best value for comprehensive career development'
    }
  ];

  // Get payment packages
  static getPaymentPackages(): PaymentPackage[] {
    return this.CREDIT_PACKAGES;
  }

  // Get package by ID
  static getPackageById(packageId: string): PaymentPackage | undefined {
    return this.CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
  }
}


