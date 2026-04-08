const mongoose = require('mongoose');
require('dotenv').config();

const userModel = require('./src/models/user.model');
const accountModel = require('./src/models/account.model');
const transactionModel = require('./src/models/transaction.model');
const ledgerModel = require('./src/models/ledger.model');

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

   await mongoose.connection.dropDatabase();
console.log("Database dropped");

    // Check if system user already exists
    const existingSystemUser = await userModel.findOne({ email: 'system@banking.com' });
    if (existingSystemUser) {
      console.log('System user already exists');
      process.exit(0);
    }

    // Create system user
    const systemUserDoc = new userModel({
      email: 'system@banking.com',
      password: 'System@123456',
      name: 'System User',
      systemUser: true
    });
    const systemUser = await systemUserDoc.save();

    console.log('System user created:', systemUser._id);

    // Create system account
    const systemAccount = await accountModel.create({
      user: systemUser._id,
      status: 'ACTIVE',
      currency: 'INR'
    });

    console.log('System account created:', systemAccount._id);

      // Ensure collections exist before starting multi-document transactions.
      // Dropping the database removes collections; creating them ahead prevents
      // "catalog changes" errors when writing inside transactions.
      try {
        await Promise.all([
          transactionModel.createCollection(),
          ledgerModel.createCollection()
        ]);
      } catch (err) {
        // ignore NamespaceExists or similar benign errors
        // rethrow unexpected errors
        if (err && err.codeName !== 'NamespaceExists') throw err;
      }

    // Create test users with initial balance
    const testUsers = [
      { email: 'john@example.com', password: 'John@123456', name: 'John Doe', initialBalance: 50000 },
      { email: 'jane@example.com', password: 'Jane@123456', name: 'Jane Smith', initialBalance: 75000 },
      { email: 'bob@example.com', password: 'Bob@123456', name: 'Bob Johnson', initialBalance: 100000 }
    ];

    console.log('\nCreating test users with initial balances...');

    for (const userData of testUsers) {
      const existingUser = await userModel.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User ${userData.email} already exists`);
        continue;
      }

      const userDoc = new userModel({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        systemUser: false
      });
      const user = await userDoc.save();

      const account = await accountModel.create({
        user: user._id,
        status: 'ACTIVE',
        currency: 'INR'
      });

      // Create initial credit transaction from system account
      const session = await mongoose.startSession();
      session.startTransaction();

      const transaction = new transactionModel({
        fromAccount: systemAccount._id,
        toAccount: account._id,
        amount: userData.initialBalance,
        idempotencyKey: `init-${user._id}-${Date.now()}`,
        status: 'PENDING'
      });

      await transaction.save({ session });

      await ledgerModel.create([{
        account: systemAccount._id,
        amount: userData.initialBalance,
        transaction: transaction._id,
        type: 'DEBIT'
      }], { session });

      await ledgerModel.create([{
        account: account._id,
        amount: userData.initialBalance,
        transaction: transaction._id,
        type: 'CREDIT'
      }], { session });

      transaction.status = 'COMPLETED';
      await transaction.save({ session });

      await session.commitTransaction();
      session.endSession();

      console.log(`✓ User created: ${userData.email} (Account: ${account._id}) (Balance: ₹${userData.initialBalance})`);
    }

    console.log('\n✓ Seeding completed successfully');
    console.log('\nSystem User Credentials:');
    console.log('Email: system@banking.com');
    console.log('Password: System@123456');
    console.log('\nTest User Credentials:');
    testUsers.forEach(user => {
      console.log(`Email: ${user.email} | Password: ${user.password} | Balance: ₹${user.initialBalance}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedDatabase();
