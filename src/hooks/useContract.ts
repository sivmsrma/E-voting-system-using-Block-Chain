import { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { VotingContract } from '../types';
import VotingABI from '../Voting.json';
import { CONTRACT_ADDRESS } from '../utils/constants';

export const useContract = () => {
    const [contract, setContract] = useState<VotingContract | null>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    const connectWallet = async (): Promise<boolean> => {
        if (!window.ethereum) return false;

        try {
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            const votingContract = new Contract(
                CONTRACT_ADDRESS,
                VotingABI.abi,
                signer
            ) as VotingContract;

            const owner = await votingContract.owner();

            setContract(votingContract);
            setAccount(address);
            setIsAdmin(owner.toLowerCase() === address.toLowerCase());

            return true;
        } catch (error) {
            console.error('Wallet connection failed:', error);
            return false;
        }
    };

    const disconnectWallet = () => {
        setContract(null);
        setAccount(null);
        setIsAdmin(false);
    };

    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = () => {
            disconnectWallet();
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);

        return () => {
            window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        };
    }, [disconnectWallet]);

    return { contract, account, isAdmin, connectWallet, disconnectWallet };
};
