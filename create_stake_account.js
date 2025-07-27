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
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const wallet = Keypair.generate();

    console.log(`Requesting airdrop for wallet: ${wallet.publicKey.toBase58()}`);

    const airdropSignature = await connection.requestAirdrop(
        wallet.publicKey,
        LAMPORTS_PER_SOL
    );
    // Wait for the transaction to be confirmed
    await connection.confirmTransaction(airdropSignature, 'confirmed');

    // Creating the stake account
    const stakeAccount = Keypair.generate();
    // mimimum amount to stake
    const minimumRent = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);;
    const amountUserWantToStake = 0.5 * LAMPORTS_PER_SOL;
    const amountToStake = minimumRent + amountUserWantToStake;
    const createStakeAccountTx = StakeProgram.createAccount(({
        authorized: new Authorized(wallet.publicKey, wallet.publicKey),
        fromPubkey: wallet.publicKey,
        lamports: amountToStake,
        lockup: new Lockup(0, 0, wallet.publicKey),
        stakePubkey: stakeAccount.publicKey,
    }))

    const createStakeAccountId = await sendAndConfirmRawTransaction(connection, createStakeAccountTx, [wallet, stakeAccount]);
    console.log(`Stake AccountID: ${createStakeAccountId}`)

    let stakeBalance = await connection.getBalance(stakeAccount.publicKey);
    console.log(`Stake Account Balance: ${stakeBalance}`);

    let stakeStatus =  await connection.getStakeActivation(stakeAccount.publicKey);
    console.log(`Stake Account Status: ${stakeStatus.state}`)
};

const runMain = async () => {
    try {
        await main();
    } catch (error) {
        console.error('Error:', error);
    }
};

runMain();
