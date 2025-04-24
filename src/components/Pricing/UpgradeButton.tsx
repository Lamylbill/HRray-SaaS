tsx
import React, { useEffect, useState, useContext } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { AuthContext } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface UpgradeButtonProps {
  priceId: string;
  children: React.ReactNode;
}

const UpgradeButton: React.FC<UpgradeButtonProps> = ({ priceId, children }) => {
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  const handleClick = async () => {
    if (!user) {
      return;
    }

    setLoading(true);

    try {
      const stripe = await stripePromise;

      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (stripe) {
        await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });
      } else {
        throw new Error("Stripe is not loaded");
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading} >
      {loading ? 'Loading...' : children}
    </Button>
  );
};

export default UpgradeButton;