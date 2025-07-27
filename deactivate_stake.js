const {
    Connection,
    clusterApiUrl,
    LAMPORTS_PER_SOL,
    Keypair,
    StakeProgram,
    Authorized,
    Lockup,
    sendAndConfirmRawTransaction,
    PublicKey,
    sendAndConfirmTransaction
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

    let stakeStatus = await connection.getStakeActivation(stakeAccount.publicKey);
    console.log(`Stake Account Status: ${stakeStatus.state}`)

    const validators = await connection.getVoteAccounts();
    const selectValidators = validators.current[0];
    const selectedValidatorPubkey = new PublicKey(selectValidators.votePubkey);

    // Build the delegate instruction to assign your stake to a validator
    const delegateIx = StakeProgram.delegate({
        // The stake account public key that you created and funded
        stakePubkey: stakeAccount.publicKey,

        // The authorized account that is allowed to delegate (your wallet in this case)
        authorizedPubkey: wallet.publicKey,

        // The validator you’re choosing to delegate to (their vote account pubkey)
        votePubkey: selectedValidatorPubkey,
    });

    // Wrap the instruction into a full transaction
    const delegateTx = new web3.Transaction().add(delegateIx);

    // Send the transaction to the blockchain and wait for confirmation
    const delegateTxId = await sendAndConfirmTransaction(connection, delegateTx, [wallet]);
    console.log(`✅ Stake account delegated to validator: ${selectedValidatorPubkey}`);
    console.log(`🧾 Transaction Signature: ${delegateTxId}`);

    // Re-check the activation status of the stake account after delegation
    stakeStatus = await connection.getStakeActivation(stakeAccount.publicKey);
    console.log(`📡 Updated Stake Account Status: ${stakeStatus.state}`);

    const deactivateTx = StakeProgram.deactivate({
        stakePubkey: stakeAccount.publicKey,
        authorizedPubkey: wallet.publicKey,
    });

    const deactivateTxId = await sendAndConfirmTransaction(connection, deactivateTx, [wallet]);
    console.log(`Stacke account deactiveate. TX id: ${deactivateTxId}`);

    stakeStatus = await connection.getStakeActivation(stakeAccount.publicKey);
    console.log(`📡 Updated Stake Account Status: ${stakeStatus.state}`);
};

const runMain = async () => {
    try {
        await main();
    } catch (error) {
        console.error('Error:', error);
    }
};

runMain();
