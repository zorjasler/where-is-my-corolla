import axios from "axios";
import { Car, IntermediateDelivery, ResponseData } from "./types";
import hash from 'object-hash';

const { WHERE_IS_MY_COROLLA_USERNAME, WHERE_IS_MY_COROLLA_PASSWORD } =
  process.env;

async function getToken() {
  try {
    const response = await axios.post(
      "https://ssoms.toyota-europe.com/authenticate",
      {
        username: WHERE_IS_MY_COROLLA_USERNAME,
        password: WHERE_IS_MY_COROLLA_PASSWORD,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-tme-lc": "es-es",
        },
      }
    );
    return response.data.token;
  } catch (error) {
    console.error("Error getting token:", error);
    return error;
  }
}

async function fetchOrdered(token: string): Promise<Car[]> {
  try {
    const response = await axios.get(
      "https://weblos.toyota-europe.com/leads/v2/ordered?displayPreApprovedCars=true&displayVOTCars=true&projectionType=orderedFind",
      {
        headers: {
          "x-tme-token": token,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching data:", error);
    return error;
  }
}

async function fetchOrder(userId: string, carId: string, token: string) {
  try {
    const response = await axios.get(
      `https://cpb2cs.toyota-europe.com/api/orderTracker/user/${userId}/orderStatus/${carId}`,
      {
        headers: {
          "x-tme-token": token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return error;
  }
}

export async function fetch(): Promise<ResponseData | undefined> {
  let response;
  const token = await getToken();
  const orderedCars = await fetchOrdered(token);
  if (orderedCars && orderedCars.length) {
    const userId = orderedCars[0].user.uuid;
    const carId = orderedCars[0].id
    response = await fetchOrder(userId, carId, token);
  }
  return response;
}

export function checkForChanges(newData: ResponseData, oldData: ResponseData | undefined): boolean {
  const newDataHash = hash(newData);
  const oldDataHash = hash(oldData ? oldData : '');
  console.log('New data hash', newDataHash);
  console.log('Old data hash', oldDataHash);
  return newDataHash !== oldDataHash;
}

export function parseData(data: ResponseData): string {
  let message = "";
  if (data && data.intermediateDeliveries) {
    const locations = data.intermediateDeliveries;
    const activeStates = ["current", "inTransit"];
    const currentLocation = locations.find((l: IntermediateDelivery) =>
      activeStates.includes(l.isVisited)
    );
    message = currentLocation
      ? `<b>Location Code:</b>\n<code>${currentLocation.locationCode}</code>\n` +
        `<b>Location Name:</b>\n<code>${currentLocation.locationName}</code>\n` +
        `<b>Country Code:</b>\n<code>${currentLocation.countryCode}</code>\n` +
        `<b>Country Name:</b>\n<code>${currentLocation.countryName}</code>\n` +
        `<b>Destination Type:</b>\n<code>${currentLocation.destinationType}</code>\n` +
        `<b>Transport Method:</b>\n<code>${currentLocation.transportMethod}</code>\n` +
        `<b>Is Visited:</b>\n<code>${currentLocation.isVisited}</code>\n` +
        `<b>Location Latitude:</b>\n<code>${currentLocation.locationLatitude}</code>\n` +
        `<b>Location Longitude:</b>\n<code>${currentLocation.locationLongitude}</code>\n`
      : "";
  }
  return message;
}
