const {
    Connection,
    clusterApiUrl,
    LAMPORTS_PER_SOL,
    Keypair,
    StakeProgram,
    Authorized,
    Lockup,
    sendAndConfirmRawTransaction
} = require('@solana/web3.js');

const main = async () => {
    // Connect to Solana Devnet
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    // Generate a new wallet keypair
    const wallet = Keypair.generate();

    console.log(`Requesting airdrop for wallet: ${wallet.publicKey.toBase58()}`);

    // Airdrop 1 SOL to the wallet
    const airdropSignature = await connection.requestAirdrop(
        wallet.publicKey,
        LAMPORTS_PER_SOL
    );

    // Confirm the airdrop transaction
    await connection.confirmTransaction(airdropSignature, 'confirmed');

    // Generate a new stake account keypair
    const stakeAccount = Keypair.generate();

    // Get the minimum rent-exempt amount required to create a stake account
    const minimumRent = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);

    // Define the amount of SOL the user wants to stake
    const amountUserWantToStake = 0.5 * LAMPORTS_PER_SOL;

    // Total amount = rent + user stake
    const amountToStake = minimumRent + amountUserWantToStake;

    // Build the stake account creation transaction
    const createStakeAccountTx = StakeProgram.createAccount({
        // Define who is authorized to manage (delegate/withdraw) the stake account
        authorized: new Authorized(wallet.publicKey, wallet.publicKey),

        // Public key that pays to create the stake account (payer)
        fromPubkey: wallet.publicKey,

        // Amount of lamports to fund the stake account
        lamports: amountToStake,

        // Lockup is an optional feature used to restrict withdrawals/delegations
        // until a certain epoch/time or custodian approval.
        // Here, we leave it at default (no lockup), meaning stake is immediately flexible.
        lockup: new Lockup(0, 0, wallet.publicKey),

        // The public key of the stake account being created
        stakePubkey: stakeAccount.publicKey,
    });

    // Send and confirm the transaction
    const createStakeAccountId = await sendAndConfirmRawTransaction(
        connection,
        createStakeAccountTx,
        [wallet, stakeAccount]
    );

    console.log(`Stake AccountID: ${createStakeAccountId}`);

    // Get and display the stake account balance
    let stakeBalance = await connection.getBalance(stakeAccount.publicKey);
    console.log(`Stake Account Balance: ${stakeBalance}`);

    // Get and display the activation status of the stake
    let stakeStatus = await connection.getStakeActivation(stakeAccount.publicKey);
    console.log(`Stake Account Status: ${stakeStatus.state}`);
};

const runMain = async () => {
    try {
        await main();
    } catch (error) {
        console.error('Error:', error);
    }
};

runMain();
