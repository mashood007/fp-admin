# C3X API Documentation

## Table of Contents
- Tracking with Airwaybill
- Tracking with Shipper Reference
- Airwaybill Generation
- Airwaybill PDF
- Pickup Request
- Pickup Tracking
- Rate Calculator

---

## Tracking – C3X Airwaybill Number

**Service**
```
https://c3xapi.c3xpress.com/C3XService.svc/Tracking
```

### Input
```json
{
  "TrackingAWB": "123456",
  "UserName": "testuser",
  "Password": "21c3xpress#",
  "AccountNo": "99999",
  "Country": "AE"
}
```

### Curl Request
```bash
curl -X POST https://c3xapi.c3xpress.com/C3XService.svc/Tracking \
  -H "Content-Type: application/json" \
  -d '{
  "TrackingAWB": "123456",
  "UserName": "testuser",
  "Password": "21c3xpress#",
  "AccountNo": "99999",
  "Country": "AE"
}'
```

### Output
```json
{
  "AirwayBillTrackList": [
    {
      "ActualWeight": "1.000",
      "AirWayBillNo": "123456",
      "ChargeableWeight": "1.000",
      "Destination": "DUBAI-UNITED ARAB EMIRATES",
      "Origin": "HONGKONG-HONG KONG",
      "ShipmentProgress": 5,
      "TrackingLogDetails": [
        {
          "ActivityDate": "Wednesday 10 January 2024",
          "ActivityTime": "16:00",
          "DeliveredTo": "ARUN",
          "Location": "DUBAI",
          "Remarks": "Delivered",
          "Status": "POD"
        }
      ]
    }
  ],
  "Code": 1,
  "Description": "Success"
}
```

---

## Tracking – Shipper Reference

**Service**
```
https://c3xapi.c3xpress.com/C3XService.svc/TrackByReference
```

### Input
```json
{
  "TrackingAWB": "AE854FTY46",
  "UserName": "testuser",
  "Password": "21c3xpress#",
  "AccountNo": "99999",
  "Country": "AE"
}
```

---

## Create Airwaybill

**Service**
```
https://c3xapi.c3xpress.com/C3XService.svc/CreateAirwayBill
```

### Input
```json
{
  "AirwayBillData": {
    "Destination": "Abu Dhabi",
    "GoodsDescription": "Beauty Products",
    "NumberofPeices": 1,
    "Origin": "DXB",
    "ProductType": "XPS",
    "Weight": 0.5
  },
  "UserName": "testuser",
  "Password": "21c3xpress#",
  "AccountNo": "99999",
  "Country": "AE"
}
```

### Output
```json
{
  "AirwayBillNumber": "2150032340",
  "Code": 1,
  "Description": "Success",
  "DestinationCode": "AUH"
}
```

---

## Pickup Request

**Service**
```
https://c3xapi.c3xpress.com/C3XService.svc/SchedulePickup
```

---

## Pickup Tracking

**Service**
```
https://c3xapi.c3xpress.com/C3XService.svc/PickupTracking
```

---

## Airwaybill PDF

**Service**
```
https://c3xapi.c3xpress.com/C3XService.svc/AirwayBillPDFFormat
```

Output is returned as Base64 encoded PDF.

---

## Rate Calculator

**Service**
```
https://c3xapi.c3xpress.com/C3XService.svc/RateFinder
```

### Input
```json
{
  "AccountNo": "99999",
  "Origin": "DXB",
  "Destination": "AUH",
  "Product": "XPS",
  "ServiceType": "NOR",
  "Weight": 1,
  "UserName": "testuser",
  "Password": "21c3xpress#",
  "Country": "AE"
}
```

### Output
```json
{
  "Code": 1,
  "Description": "Success",
  "NetAmount": 35
}
```
