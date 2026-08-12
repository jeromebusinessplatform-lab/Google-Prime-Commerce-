import { Request, Response } from "express";
import axios from "axios";

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;

export const autocompleteHandler = async (req: Request, res: Response) => {
  const { text, proximity } = req.body;
  if (!text || text.length < 3) return res.json({ data: [] });

  try {
    // Philippine bias
    let url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&apiKey=${GEOAPIFY_API_KEY}&filter=countrycode:ph&limit=10`;
    if (proximity) {
      url += `&bias=proximity:${proximity.lng},${proximity.lat}`;
    }

    const response = await axios.get(url);
    const results = response.data.features || [];
    
    // Apply Metro Manila/NCR boost
    const boosted = results.sort((a: any, b: any) => {
      const isANCR = a.properties.region === 'National Capital Region' || a.properties.state === 'National Capital Region';
      const isBNCR = b.properties.region === 'National Capital Region' || b.properties.state === 'National Capital Region';
      if (isANCR && !isBNCR) return -1;
      if (!isANCR && isBNCR) return 1;
      return 0;
    }).slice(0, 5);

    res.json({ data: boosted });
  } catch (e) {
    res.status(500).json({ error: "Geoapify error" });
  }
};

export const geocodeHandler = async (req: Request, res: Response) => {
  const { text } = req.body;
  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(text)}&apiKey=${GEOAPIFY_API_KEY}&filter=countrycode:ph&limit=1`;
    const response = await axios.get(url);
    res.json({ data: response.data.features?.[0] || null });
  } catch (e) {
    res.status(500).json({ error: "Geocoding failed" });
  }
};

export const reverseGeocodeHandler = async (req: Request, res: Response) => {
  const { lat, lng } = req.body;
  try {
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${GEOAPIFY_API_KEY}`;
    const response = await axios.get(url);
    res.json({ data: response.data.features?.[0] || null });
  } catch (e) {
    res.status(500).json({ error: "Reverse geocoding failed" });
  }
};

export const routingHandler = async (req: Request, res: Response) => {
  const { origin, destination, mode } = req.body;
  try {
    const url = `https://api.geoapify.com/v1/routing?waypoints=${origin.lat},${origin.lng}|${destination.lat},${destination.lng}&mode=${mode}&apiKey=${GEOAPIFY_API_KEY}`;
    const response = await axios.get(url);
    const route = response.data.features?.[0];
    if (!route) return res.status(404).json({ error: "No route found" });
    
    res.json({ 
      distanceMeters: route.properties.distance,
      durationSeconds: route.properties.time
    });
  } catch (e) {
    res.status(500).json({ error: "Routing failed" });
  }
};
