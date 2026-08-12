import { Request, Response } from "express";

export const autocompleteHandler = async (req: Request, res: Response) => {
  const { q } = req.query;
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey || apiKey === "") {
    // Fake provider for preview/development
    const fakeData = [
      { properties: { formatted: `${q} St, Makati, Metro Manila, Philippines`, lat: 14.5547, lon: 121.0244, city: "Makati" } },
      { properties: { formatted: `${q} Ave, Quezon City, NCR, Philippines`, lat: 14.6760, lon: 121.0437, city: "Quezon City" } }
    ];
    return res.json({ results: fakeData });
  }

  try {
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(q as string)}&filter=countrycode:ph&bias=proximity:121.0509,14.5823&format=json&apiKey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Location search failed" });
  }
};

export const geocodeHandler = async (req: Request, res: Response) => {
  const { text } = req.query;
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey || apiKey === "") {
    return res.json({ results: [{ properties: { formatted: text, lat: 14.5, lon: 121.0 } }] });
  }
  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(text as string)}&format=json&apiKey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Geocoding failed" });
  }
};

export const reverseGeocodeHandler = async (req: Request, res: Response) => {
  const { lat, lon } = req.query;
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey || apiKey === "") {
    return res.json({ results: [{ properties: { formatted: `Fake Pin at ${lat}, ${lon}`, lat: Number(lat), lon: Number(lon) } }] });
  }
  try {
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&format=json&apiKey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Reverse geocoding failed" });
  }
};

export const routeHandler = async (req: Request, res: Response) => {
  const { waypoints } = req.body;
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey || apiKey === "") {
    return res.json({ features: [{ properties: { distance: 5500, time: 1200 } }] }); // Fake 5.5km
  }
  try {
    const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=motorcycle&apiKey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Routing failed" });
  }
}
