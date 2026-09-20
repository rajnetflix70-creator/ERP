import { useState, useEffect } from 'react';
import apiClient from '../api/client';

const lookupCache = {};

/**
 * Hook to fetch dynamic dropdown options from the database with in-memory caching
 */
export const useLookup = (type) => {
  const [data, setData] = useState(lookupCache[type] || []);
  const [loading, setLoading] = useState(!lookupCache[type]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!type) return;

    if (lookupCache[type]) {
      setData(lookupCache[type]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    apiClient.get(`/lookup/${type}`)
      .then((res) => {
        if (isMounted) {
          const result = res.data?.data || [];
          lookupCache[type] = result;
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.message || err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [type]);

  const refresh = () => {
    delete lookupCache[type];
    setLoading(true);
    return apiClient.get(`/lookup/${type}`).then((res) => {
      const result = res.data?.data || [];
      lookupCache[type] = result;
      setData(result);
      setLoading(false);
      return result;
    });
  };

  return { data, loading, error, refresh };
};

export default useLookup;
