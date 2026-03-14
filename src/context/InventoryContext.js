import React, { createContext, useState, useEffect, useContext } from 'react';
import { initialProducts, initialMovements, warehouses } from '../data/mockData';
import { auth, db } from '../firebase';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where 
} from 'firebase/firestore';

const InventoryContext = createContext();

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('products');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [movements, setMovements] = useState(() => {
    const saved = localStorage.getItem('movements');
    return saved ? JSON.parse(saved) : [];
  });

  const [warehouses, setWarehouses] = useState(() => {
    const saved = localStorage.getItem('warehouses');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : [];
  });

  // Auth state listener
  useEffect(() => {
    console.log("Initializing Auth listener...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log("User detected, fetching profile...");
          // FETCH profile with a timeout to prevent white screen hang
          const profilePromise = getDoc(doc(db, 'users', firebaseUser.uid));
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Profile fetch timeout")), 3000)
          );

          try {
            const userDoc = await Promise.race([profilePromise, timeoutPromise]);
            if (userDoc.exists()) {
              setUser({ ...firebaseUser, ...userDoc.data(), role: 'Inventory Manager' });
            } else {
              setUser({ ...firebaseUser, role: 'Inventory Manager' });
            }
          } catch (profileError) {
            console.warn("Could not fetch user profile (Rules or Timeout), using default auth:", profileError);
            setUser({ ...firebaseUser, role: 'Inventory Manager' });
          }
        } else {
          setUser(null);
        }
      } catch (authError) {
        console.error("Auth listener error:", authError);
      } finally {
        setLoading(false);
      }
    });
    
    // Safety fallback: if Firebase never responds in 10s, show the app anyway
    const initTimeout = setTimeout(() => {
      if (loading) {
        console.warn("Auth initialization timed out, forcing loading end.");
        setLoading(false);
      }
    }, 10000);

    return () => {
      unsubscribe();
      clearTimeout(initTimeout);
    };
  }, []);

  useEffect(() => {
    // Clean slate: Clear local storage once to remove any old demo data
    const isCleaned = localStorage.getItem('isCleaned_v1');
    if (!isCleaned) {
      localStorage.removeItem('products');
      localStorage.removeItem('movements');
      localStorage.setItem('isCleaned_v1', 'true');
      setProducts([]);
      setMovements([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('movements', JSON.stringify(movements));
    localStorage.setItem('warehouses', JSON.stringify(warehouses));
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [products, movements, warehouses, categories]);

  const login = async (identifier, password) => {
    try {
      let email = identifier;
      
      // If it's not an email, try to find it as a loginId in Firestore
      if (!identifier.includes('@')) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('loginId', '==', identifier.toLowerCase()));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          return { success: false, message: 'Invalid Login Id or Password' };
        }
        email = querySnapshot.docs[0].data().email;
      }

      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      console.error("Login Error:", error);
      return { success: false, message: 'Invalid Login Id or Password' };
    }
  };

  const signupUser = async (userData) => {
    try {
      console.log("Starting signup process for:", userData.email);
      // 1. Check if loginId is unique in Firestore
      console.log("Checking loginId uniqueness for:", userData.loginId);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('loginId', '==', userData.loginId.toLowerCase()));
      
      const checkUniqueness = getDocs(q);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database Uniqueness Check timed out (15s)")), 15000)
      );

      try {
        const querySnapshot = await Promise.race([checkUniqueness, timeoutPromise]);
        if (!querySnapshot.empty) {
          console.log("Login ID already exists in Firestore");
          return { success: false, message: 'Login ID already exists' };
        }
        console.log("Login ID is unique");
      } catch (checkError) {
        console.error("Firestore Uniqueness Check Error:", checkError);
        if (checkError.code === 'permission-denied') {
          return {
            success: false,
            message: "Database Access Denied. Because you selected 'Production Mode', you must update your Security Rules to allow writes."
          };
        }
        return { 
          success: false, 
          message: "Database connection timed out. Please verify Firestore is enabled in your Firebase Console and rules allow public access for development." 
        };
      }

      // 2. Create user in Firebase Auth
      console.log("Creating user in Firebase Auth...");
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const newUser = userCredential.user;
      console.log("Auth user created successfully:", newUser.uid);

      // 3. Store extra details in Firestore
      console.log("Storing user profile in Firestore...");
      try {
        const firestoreWrite = setDoc(doc(db, 'users', newUser.uid), {
          loginId: userData.loginId.toLowerCase(),
          email: userData.email,
          createdAt: new Date().toISOString()
        });

        const writeTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Database Write timed out (15s)")), 15000)
        );

        await Promise.race([firestoreWrite, writeTimeoutPromise]);
        console.log("Firestore profile document created successfully");
      } catch (writeError) {
        console.error("Firestore Profile Write Error:", writeError);
        return { 
          success: false, 
          message: "Account created in Auth, but could not save profile details. Please ensure Firestore is initialized in 'Native Mode' and rules are published." 
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Signup Error Details:", error);
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: 'Email ID already exists' };
      }
      return { success: false, message: error.message || "An unexpected error occurred during signup." };
    }
  };

  const skipLogin = () => {
    setUser({
      uid: 'guest-trial',
      email: 'guest@stockpilot.demo',
      loginId: 'guest',
      role: 'Trial User',
      isGuest: true
    });
    return { success: true };
  };

  const logout = async () => {
    await signOut(auth);
  };

  const forgotPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
  };

  const addProduct = (product) => {
    const newProduct = { ...product, id: Date.now().toString() };
    setProducts([...products, newProduct]);
  };

  const updateProduct = (id, updatedFields) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updatedFields } : p));
  };

  const deleteProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const addMovement = (movement) => {
    const newMovement = { 
      ...movement, 
      id: 'm' + Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
    setMovements([newMovement, ...movements]);
  };

  // Operations ... (Receipt, Delivery, Transfer, Adjustment logic remains the same)
  const processReceipt = (productId, quantity, location, reference) => {
    const product = products.find(p => p.id === productId);
    if (!product) return false;
    updateProduct(productId, { stock: Number(product.stock) + Number(quantity) });
    addMovement({
      productId, productName: product.name, type: 'Receipt',
      quantityChange: Number(quantity), location, reference, status: 'Done'
    });
    return true;
  };

  const processDelivery = (productId, quantity, location, reference) => {
    const product = products.find(p => p.id === productId);
    if (!product || Number(product.stock) < Number(quantity)) return false;
    updateProduct(productId, { stock: Number(product.stock) - Number(quantity) });
    addMovement({
      productId, productName: product.name, type: 'Delivery',
      quantityChange: -Number(quantity), location, reference, status: 'Done'
    });
    return true;
  };

  const processTransfer = (productId, quantity, fromLocation, toLocation, reference) => {
    const product = products.find(p => p.id === productId);
    if (!product) return false;
    updateProduct(productId, { location: toLocation });
    addMovement({
      productId, productName: product.name, type: 'Internal Transfer',
      quantityChange: 0, location: `${fromLocation} -> ${toLocation}`, reference, status: 'Done'
    });
    return true;
  };

  const processAdjustment = (productId, recordedQty, actualQty, location, reason) => {
    const product = products.find(p => p.id === productId);
    if (!product) return false;
    const diff = Number(actualQty) - Number(recordedQty);
    updateProduct(productId, { stock: Number(actualQty) });
    addMovement({
      productId, productName: product.name, type: 'Adjustment',
      quantityChange: diff, location, reference: reason || 'Inventory Count', status: 'Done'
    });
    return true;
  };

  return (
    <InventoryContext.Provider value={{
      user, login, signupUser, logout, skipLogin, forgotPassword, loading,
      products, warehouses, categories, movements,
      addProduct, updateProduct, deleteProduct,
      addWarehouse: (w) => setWarehouses([...warehouses, w]),
      addCategory: (c) => setCategories([...categories, c]),
      processReceipt, processDelivery, processTransfer, processAdjustment
    }}>
      {!loading && children}
    </InventoryContext.Provider>
  );
};
