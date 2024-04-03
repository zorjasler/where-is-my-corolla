export interface Location {
  lat: number;
  lng: number;
}

export interface Step {
  status: string;
  iconKey: string;
  location?: string;
}

export interface PreprocessedData {
  steps: {
    processedOrder: Step;
    buildInProgress: Step;
    leftTheFactory: Step;
    inTransit: Step;
    arrivedAtRetailer: Step;
  };
  map: {
    iconKey: string;
    location: Location;
    status: string;
  }[];
}

export interface CurrentStatus {
  currentStatus: string;
  callOffStatus: string;
  damageCode: string;
  isDelayed: boolean | null;
}

export interface IntermediateDelivery {
  locationCode: string;
  locationName: string;
  countryCode: string;
  countryName: string;
  destinationType: string;
  transportMethod: string;
  isVisited: string;
  locationLatitude: number;
  locationLongitude: number;
}

export interface DealerDetails {
  phone: string;
  email: string;
  name: string;
  address1: string;
  address2: string;
}

export interface OrderDetails {
  orderId: string;
  vehicleModel: string;
  vehicleExternalColor: string;
  engine: string;
  transmission: string;
  modelCode: string;
  imageUrl: string;
  orderToBeDisplayed: string;
  stopped: boolean;
}

export interface ResponseData {
  preprocessed: PreprocessedData;
  currentStatus: CurrentStatus;
  intermediateDeliveries: IntermediateDelivery[];
  dealerDetails: DealerDetails;
  orderDetails: OrderDetails;
}

export interface User {
  uuid: string;
}

export interface Car {
  id: string;
  alias: string;
  brand: string;
  isComplete: boolean;
  createdOn: string;
  type: string;
  user: User;
}
