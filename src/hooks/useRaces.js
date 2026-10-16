import { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../config';

export const useRaces = () => {
    const [races, setRaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRaces = async () => {
            try {
                const racesRef = collection(db, 'races');
                const q = query(racesRef); // You can add orderBy here if needed, e.g., orderBy('teamName')
                const snapshot = await getDocs(q);

                const racesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).sort((a, b) => a.teamName.localeCompare(b.teamName));

                setRaces(racesData);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching races:", err);
                setError(err);
                setLoading(false);
            }
        };

        fetchRaces();
    }, []);

    return { races, loading, error };
};
