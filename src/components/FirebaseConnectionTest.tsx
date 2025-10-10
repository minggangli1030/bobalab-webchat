"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function FirebaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Testing...");
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults((prev) => [...prev, result]);
  };

  useEffect(() => {
    const testFirebaseConnection = async () => {
      try {
        addResult("🔍 Testing Firebase connection...");

        // Test 1: Check if auth is initialized
        if (auth) {
          addResult("✅ Firebase Auth initialized");
        } else {
          addResult("❌ Firebase Auth not initialized");
          setConnectionStatus("Failed - Auth not initialized");
          return;
        }

        // Test 2: Check if Firestore is initialized
        if (db) {
          addResult("✅ Firestore initialized");
        } else {
          addResult("❌ Firestore not initialized");
          setConnectionStatus("Failed - Firestore not initialized");
          return;
        }

        // Test 3: Test Firestore write/read
        try {
          const testDocRef = doc(db, "test", "connection");
          await setDoc(testDocRef, {
            timestamp: new Date(),
            test: true,
          });
          addResult("✅ Firestore write test successful");

          const testDoc = await getDoc(testDocRef);
          if (testDoc.exists()) {
            addResult("✅ Firestore read test successful");
          } else {
            addResult("❌ Firestore read test failed");
          }
        } catch (error: any) {
          addResult(`❌ Firestore test failed: ${error.message}`);
          addResult(`   Error code: ${error.code || "unknown"}`);
        }

        // Test 4: Check auth state
        auth.onAuthStateChanged((user) => {
          if (user) {
            addResult("✅ Auth state listener working (user logged in)");
          } else {
            addResult("✅ Auth state listener working (no user)");
          }
        });

        setConnectionStatus("✅ Firebase connection successful");
      } catch (error: any) {
        addResult(`❌ Connection test failed: ${error.message}`);
        setConnectionStatus(`Failed - ${error.message}`);
      }
    };

    testFirebaseConnection();
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">Firebase Connection Test</h3>
      <div className="mb-2">
        <strong>Status:</strong> {connectionStatus}
      </div>
      <div className="space-y-1">
        {testResults.map((result, index) => (
          <div key={index} className="text-sm font-mono">
            {result}
          </div>
        ))}
      </div>
    </div>
  );
}
