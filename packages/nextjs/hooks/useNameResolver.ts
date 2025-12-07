"use client";

import { useEffect, useState } from 'react';
import { ensService } from '~~/services/ens/ENSService';
import { basenameService } from '~~/services/ens/BasenameService';

/**
 * Unified Name Resolver Hook
 *
 * Resolves both ENS (.eth) and Basename (.base.eth) names
 * Automatically detects the type and uses the appropriate service
 */

export interface NameResolutionData {
  address: string | null;
  name: string;
  isLoading: boolean;
  isError: boolean;
  error?: string;
  isBasename: boolean;
  isEns: boolean;
}

export function useNameResolver(name?: string) {
  const [data, setData] = useState<NameResolutionData>({
    address: null,
    name: name || '',
    isLoading: false,
    isError: false,
    isBasename: false,
    isEns: false,
  });

  useEffect(() => {
    if (!name) {
      setData({
        address: null,
        name: '',
        isLoading: false,
        isError: false,
        isBasename: false,
        isEns: false,
      });
      return;
    }

    const resolveName = async () => {
      setData(prev => ({ ...prev, isLoading: true, isError: false }));

      try {
        const normalizedName = name.toLowerCase().trim();

        // Determine if it's a Basename or ENS name
        const isBasename = normalizedName.endsWith('.base.eth');
        const isEns = normalizedName.endsWith('.eth') && !isBasename;

        if (isBasename) {
          // Resolve using Basename service
          const result = await basenameService.resolveBasenameToAddress(normalizedName);
          setData({
            address: result.address,
            name: result.name,
            isLoading: false,
            isError: !result.isValid && result.address === null,
            error: !result.isValid ? 'Invalid Basename format' : undefined,
            isBasename: true,
            isEns: false,
          });
        } else if (isEns) {
          // Resolve using ENS service
          const result = await ensService.resolveENSToAddress(normalizedName);
          setData({
            address: result.address,
            name: result.name,
            isLoading: false,
            isError: !result.isValid && result.address === null,
            error: !result.isValid ? 'Invalid ENS name format' : undefined,
            isBasename: false,
            isEns: true,
          });
        } else {
          // Not a recognized name format
          setData({
            address: null,
            name: normalizedName,
            isLoading: false,
            isError: true,
            error: 'Name must end with .eth or .base.eth',
            isBasename: false,
            isEns: false,
          });
        }
      } catch (error) {
        setData(prev => ({
          ...prev,
          isLoading: false,
          isError: true,
          error: error instanceof Error ? error.message : 'Failed to resolve name',
        }));
      }
    };

    resolveName();
  }, [name]);

  return data;
}

/**
 * Reverse Name Resolution Hook
 *
 * Resolves an address to its ENS or Basename
 * Tries Basename first (since we're on BASE), then falls back to ENS
 */
export interface ReverseNameData {
  name: string | null;
  address: string;
  isLoading: boolean;
  isError: boolean;
  error?: string;
  isBasename: boolean;
  isEns: boolean;
}

export function useReverseNameResolver(address?: string) {
  const [data, setData] = useState<ReverseNameData>({
    name: null,
    address: address || '',
    isLoading: false,
    isError: false,
    isBasename: false,
    isEns: false,
  });

  useEffect(() => {
    if (!address) {
      setData({
        name: null,
        address: '',
        isLoading: false,
        isError: false,
        isBasename: false,
        isEns: false,
      });
      return;
    }

    const resolveName = async () => {
      setData(prev => ({ ...prev, isLoading: true, isError: false }));

      try {
        // Try Basename first (we're on BASE)
        const basenameName = await basenameService.reverseResolve(address);

        if (basenameName) {
          setData({
            name: basenameName,
            address,
            isLoading: false,
            isError: false,
            isBasename: true,
            isEns: false,
          });
          return;
        }

        // Fall back to ENS
        const ensName = await ensService.reverseResolve(address);

        if (ensName) {
          setData({
            name: ensName,
            address,
            isLoading: false,
            isError: false,
            isBasename: false,
            isEns: true,
          });
          return;
        }

        // No name found
        setData({
          name: null,
          address,
          isLoading: false,
          isError: false,
          isBasename: false,
          isEns: false,
        });
      } catch (error) {
        setData(prev => ({
          ...prev,
          isLoading: false,
          isError: true,
          error: error instanceof Error ? error.message : 'Failed to reverse resolve address',
        }));
      }
    };

    resolveName();
  }, [address]);

  return data;
}
