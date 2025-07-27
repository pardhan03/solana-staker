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
    const connection = new Connection(clusterApiUrl('devnet'), 'processed')

    const STAKE_PROGRAM_ID = new PublicKey('STake1111111');
    const VOTE_PUB_KEY = 'your key';

    const account = await connection.getParsedAccountInfo(
        STAKE_PROGRAM_ID,
        {
            filter: [
                { dataSize: 200 },
                {
                    memcmp: {
                        offsize: 124,
                        bytes: VOTE_PUB_KEY
                    }
                }
            ]
        }
    );

    console.log(`Total numbers of delegator found for ${VOTE_PUB_KEY} is : ${account.length}`);
    if(account.length){
        console.log(`Sample delegator: ${account[0]}`);
    }
}

const runMain = async () => {
    try {
        await main();
    } catch (error) {
        console.log(error);
    }
}

runMain();