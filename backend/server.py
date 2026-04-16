from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ── Models ──────────────────────────────────────────────────────────

class InventoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    quantity: float
    unit: str = "kg"
    quality_grade: str = "A"
    price_per_unit: float = 0.0
    category: str = "produce"
    farmer_name: str = "Green Valley Farm"
    status: str = "available"
    harvest_date: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class InventoryCreate(BaseModel):
    name: str
    quantity: float
    unit: str = "kg"
    quality_grade: str = "A"
    price_per_unit: float = 0.0
    category: str = "produce"
    farmer_name: str = "Green Valley Farm"
    harvest_date: Optional[str] = None


class InventoryUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    quality_grade: Optional[str] = None
    price_per_unit: Optional[float] = None
    category: Optional[str] = None
    status: Optional[str] = None
    harvest_date: Optional[str] = None


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    inventory_id: str
    item_name: str
    quantity: float
    unit: str = "kg"
    total_price: float
    retailer_name: str = "Fresh Market Store"
    status: str = "pending"
    warehouse_status: str = "awaiting"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class OrderCreate(BaseModel):
    inventory_id: str
    item_name: str
    quantity: float
    unit: str = "kg"
    total_price: float
    retailer_name: str = "Fresh Market Store"


class OrderStatusUpdate(BaseModel):
    status: Optional[str] = None
    warehouse_status: Optional[str] = None


class SaleRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_name: str
    quantity: float
    unit: str = "kg"
    sale_price: float
    retailer_name: str = "Fresh Market Store"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SaleCreate(BaseModel):
    item_name: str
    quantity: float
    unit: str = "kg"
    sale_price: float
    retailer_name: str = "Fresh Market Store"


class Alert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    severity: str = "info"
    message: str
    role: str
    read: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AlertCreate(BaseModel):
    type: str
    severity: str = "info"
    message: str
    role: str


class Profile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    role: str
    name: str
    location: str
    contact: str
    bio: str = ""
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ── Inventory Endpoints ─────────────────────────────────────────────

@api_router.get("/inventory", response_model=List[InventoryItem])
async def get_inventory():
    items = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    return items


@api_router.post("/inventory", response_model=InventoryItem)
async def create_inventory(item: InventoryCreate):
    inv_item = InventoryItem(**item.model_dump())
    doc = inv_item.model_dump()
    await db.inventory.insert_one(doc)
    alert = Alert(
        type="stock", severity="info",
        message=f"New listing: {item.name} ({item.quantity} {item.unit}) added by {item.farmer_name}",
        role="all"
    )
    await db.alerts.insert_one(alert.model_dump())
    return inv_item


@api_router.put("/inventory/{item_id}", response_model=InventoryItem)
async def update_inventory(item_id: str, update: InventoryUpdate):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.inventory.find_one_and_update(
        {"id": item_id}, {"$set": update_data}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Item not found")
    result.pop("_id", None)
    return result


@api_router.delete("/inventory/{item_id}")
async def delete_inventory(item_id: str):
    result = await db.inventory.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted"}


# ── Order Endpoints ─────────────────────────────────────────────────

@api_router.get("/orders", response_model=List[Order])
async def get_orders():
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    return orders


@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    inv_item = await db.inventory.find_one({"id": order.inventory_id}, {"_id": 0})
    if not inv_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    if inv_item["quantity"] < order.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    order_obj = Order(**order.model_dump())
    await db.orders.insert_one(order_obj.model_dump())
    new_qty = inv_item["quantity"] - order.quantity
    new_status = "available" if new_qty > 0 else "sold"
    await db.inventory.update_one(
        {"id": order.inventory_id},
        {"$set": {"quantity": new_qty, "status": new_status,
                  "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    farmer_alert = Alert(type="order", severity="info",
                         message=f"Order received: {order.quantity} {order.unit} of {order.item_name} by {order.retailer_name}",
                         role="farmer")
    warehouse_alert = Alert(type="order", severity="info",
                            message=f"Incoming shipment: {order.quantity} {order.unit} of {order.item_name} for processing",
                            role="warehouse")
    await db.alerts.insert_one(farmer_alert.model_dump())
    await db.alerts.insert_one(warehouse_alert.model_dump())
    return order_obj


@api_router.put("/orders/{order_id}/status", response_model=Order)
async def update_order_status(order_id: str, update: OrderStatusUpdate):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.orders.find_one_and_update(
        {"id": order_id}, {"$set": update_data}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Order not found")
    result.pop("_id", None)
    return result


# ── Sales Endpoints ─────────────────────────────────────────────────

@api_router.get("/sales", response_model=List[SaleRecord])
async def get_sales():
    sales = await db.sales.find({}, {"_id": 0}).to_list(1000)
    return sales


@api_router.post("/sales", response_model=SaleRecord)
async def create_sale(sale: SaleCreate):
    sale_obj = SaleRecord(**sale.model_dump())
    await db.sales.insert_one(sale_obj.model_dump())
    return sale_obj


# ── Alerts ──────────────────────────────────────────────────────────

@api_router.get("/alerts")
async def get_alerts(role: Optional[str] = None):
    query = {}
    if role:
        query["$or"] = [{"role": role}, {"role": "all"}]
    alerts = await db.alerts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return alerts


@api_router.post("/alerts", response_model=Alert)
async def create_alert(alert: AlertCreate):
    alert_obj = Alert(**alert.model_dump())
    await db.alerts.insert_one(alert_obj.model_dump())
    return alert_obj


# ── IoT Simulation ──────────────────────────────────────────────────

@api_router.get("/warehouse/iot")
async def get_iot_data():
    zones = [
        {"name": "Zone A - Cold Storage", "type": "cold"},
        {"name": "Zone B - Dry Storage", "type": "dry"},
        {"name": "Zone C - Ambient", "type": "ambient"},
        {"name": "Zone D - Freezer", "type": "freezer"},
    ]
    result = []
    for z in zones:
        if z["type"] == "cold":
            temp, hum = round(random.uniform(2, 8), 1), round(random.uniform(85, 95), 1)
        elif z["type"] == "freezer":
            temp, hum = round(random.uniform(-20, -15), 1), round(random.uniform(40, 60), 1)
        elif z["type"] == "dry":
            temp, hum = round(random.uniform(18, 25), 1), round(random.uniform(30, 45), 1)
        else:
            temp, hum = round(random.uniform(20, 28), 1), round(random.uniform(50, 70), 1)
        status = "normal"
        if z["type"] == "cold" and temp > 6:
            status = "warning"
        elif z["type"] == "freezer" and temp > -16:
            status = "critical"
        elif z["type"] == "dry" and hum > 42:
            status = "warning"
        result.append({
            "zone": z["name"], "temperature": temp, "humidity": hum,
            "status": status, "last_updated": datetime.now(timezone.utc).isoformat()
        })
    return result


# ── Dashboard Metrics ───────────────────────────────────────────────

@api_router.get("/dashboard/{role}")
async def get_dashboard(role: str):
    if role == "farmer":
        inventory = await db.inventory.find({}, {"_id": 0}).to_list(1000)
        orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
        total_listings = len([i for i in inventory if i.get("status") == "available"])
        pending_orders = len([o for o in orders if o.get("status") == "pending"])
        earnings = sum(o.get("total_price", 0) for o in orders if o.get("status") in ["confirmed", "delivered", "received"])
        harvest_data = []
        for item in inventory:
            harvest_data.append({"name": item["name"], "quantity": item["quantity"]})
        return {
            "total_listings": total_listings, "pending_orders": pending_orders,
            "recent_earnings": round(earnings, 2), "total_items": len(inventory),
            "harvest_data": harvest_data
        }
    elif role == "warehouse":
        inventory = await db.inventory.find({}, {"_id": 0}).to_list(1000)
        orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
        total_cap = 10000
        current = sum(i.get("quantity", 0) for i in inventory)
        utilization = round((current / total_cap) * 100, 1) if total_cap else 0
        active_ship = len([o for o in orders if o.get("status") in ["confirmed", "in_transit"]])
        spoilage = len([i for i in inventory if i.get("quality_grade") in ["C", "D"]])
        return {
            "capacity_utilization": utilization, "current_stock": current,
            "total_capacity": total_cap, "active_shipments": active_ship,
            "spoilage_risk": spoilage,
            "incoming": len([o for o in orders if o.get("warehouse_status") == "awaiting"]),
            "processing": len([o for o in orders if o.get("warehouse_status") == "processing"]),
            "dispatched": len([o for o in orders if o.get("warehouse_status") == "dispatched"])
        }
    elif role == "retailer":
        orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
        sales = await db.sales.find({}, {"_id": 0}).to_list(1000)
        daily_sales = sum(s.get("sale_price", 0) for s in sales)
        in_transit = len([o for o in orders if o.get("status") == "in_transit"])
        delivered = len([o for o in orders if o.get("status") in ["delivered", "received"]])
        demand = {}
        for s in sales:
            n = s.get("item_name", "Other")
            demand[n] = demand.get(n, 0) + s.get("quantity", 0)
        return {
            "daily_sales": round(daily_sales, 2), "total_orders": len(orders),
            "in_transit": in_transit, "delivered": delivered,
            "demand_insights": [{"name": k, "value": round(v, 1)} for k, v in demand.items()],
            "profit_margin": round(random.uniform(15, 35), 1)
        }
    return {}


# ── Profiles ────────────────────────────────────────────────────────

@api_router.get("/profiles/{role}")
async def get_profile(role: str):
    profile = await db.profiles.find_one({"role": role}, {"_id": 0})
    if not profile:
        defaults = {
            "farmer": Profile(role="farmer", name="Green Valley Farm", location="Sacramento, CA",
                              contact="farmer@greenvalley.com", bio="Family-owned organic farm since 1985"),
            "warehouse": Profile(role="warehouse", name="Central Distribution Hub", location="Oakland, CA",
                                 contact="ops@centralhub.com", bio="State-of-the-art cold storage facility"),
            "retailer": Profile(role="retailer", name="Fresh Market Store", location="San Francisco, CA",
                                contact="orders@freshmarket.com", bio="Premium grocery retailer serving the Bay Area"),
        }
        if role in defaults:
            doc = defaults[role].model_dump()
            await db.profiles.insert_one(doc)
            return defaults[role]
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@api_router.put("/profiles/{role}")
async def update_profile(role: str, profile: Profile):
    profile.updated_at = datetime.now(timezone.utc).isoformat()
    doc = profile.model_dump()
    await db.profiles.update_one({"role": role}, {"$set": doc}, upsert=True)
    result = await db.profiles.find_one({"role": role}, {"_id": 0})
    return result


# ── Seed Data ───────────────────────────────────────────────────────

@api_router.post("/seed")
async def seed_data():
    count = await db.inventory.count_documents({})
    if count > 0:
        return {"message": "Data already seeded", "seeded": False}

    now = datetime.now(timezone.utc)
    items = [
        InventoryItem(name="Tomatoes", quantity=500, unit="kg", quality_grade="A",
                      price_per_unit=3.50, category="vegetables", farmer_name="Green Valley Farm",
                      harvest_date=(now - timedelta(days=2)).isoformat()),
        InventoryItem(name="Organic Spinach", quantity=200, unit="kg", quality_grade="A+",
                      price_per_unit=5.00, category="leafy_greens", farmer_name="Green Valley Farm",
                      harvest_date=(now - timedelta(days=1)).isoformat()),
        InventoryItem(name="Sweet Corn", quantity=350, unit="kg", quality_grade="B",
                      price_per_unit=2.80, category="grains", farmer_name="Sunrise Acres",
                      harvest_date=(now - timedelta(days=3)).isoformat()),
        InventoryItem(name="Red Potatoes", quantity=800, unit="kg", quality_grade="A",
                      price_per_unit=1.90, category="root_vegetables", farmer_name="Heritage Fields",
                      harvest_date=(now - timedelta(days=5)).isoformat()),
        InventoryItem(name="Strawberries", quantity=150, unit="kg", quality_grade="A+",
                      price_per_unit=8.50, category="fruits", farmer_name="Berry Hills",
                      harvest_date=now.isoformat()),
        InventoryItem(name="Bell Peppers", quantity=280, unit="kg", quality_grade="A",
                      price_per_unit=4.20, category="vegetables", farmer_name="Green Valley Farm",
                      harvest_date=(now - timedelta(days=1)).isoformat()),
        InventoryItem(name="Carrots", quantity=450, unit="kg", quality_grade="B",
                      price_per_unit=2.10, category="root_vegetables", farmer_name="Sunrise Acres",
                      harvest_date=(now - timedelta(days=4)).isoformat()),
        InventoryItem(name="Kale", quantity=120, unit="kg", quality_grade="A",
                      price_per_unit=6.00, category="leafy_greens", farmer_name="Heritage Fields",
                      harvest_date=(now - timedelta(days=2)).isoformat()),
    ]
    for item in items:
        await db.inventory.insert_one(item.model_dump())

    orders_data = [
        Order(inventory_id=items[0].id, item_name="Tomatoes", quantity=100, unit="kg",
              total_price=350.00, retailer_name="Fresh Market Store", status="delivered",
              warehouse_status="dispatched"),
        Order(inventory_id=items[1].id, item_name="Organic Spinach", quantity=50, unit="kg",
              total_price=250.00, retailer_name="CityGrocer", status="in_transit",
              warehouse_status="processing"),
        Order(inventory_id=items[4].id, item_name="Strawberries", quantity=30, unit="kg",
              total_price=255.00, retailer_name="Fresh Market Store", status="pending",
              warehouse_status="awaiting"),
    ]
    for order in orders_data:
        await db.orders.insert_one(order.model_dump())

    sales_data = [
        SaleRecord(item_name="Tomatoes", quantity=80, sale_price=400.00),
        SaleRecord(item_name="Organic Spinach", quantity=30, sale_price=180.00),
        SaleRecord(item_name="Sweet Corn", quantity=60, sale_price=210.00),
        SaleRecord(item_name="Red Potatoes", quantity=120, sale_price=276.00),
        SaleRecord(item_name="Strawberries", quantity=25, sale_price=255.00),
        SaleRecord(item_name="Bell Peppers", quantity=45, sale_price=226.80),
    ]
    for sale in sales_data:
        await db.sales.insert_one(sale.model_dump())

    alerts_data = [
        Alert(type="order", severity="info", message="Retailer 'Fresh Market Store' ordered 100kg Tomatoes", role="farmer"),
        Alert(type="stock", severity="warning", message="Strawberry stock running low (150kg remaining)", role="warehouse"),
        Alert(type="climate", severity="warning", message="Cold storage Zone A temperature rising - 7.2C", role="warehouse"),
        Alert(type="system", severity="info", message="New produce listing: 8 items available from farms", role="retailer"),
        Alert(type="order", severity="info", message="Order #1001 delivered successfully", role="retailer"),
    ]
    for alert in alerts_data:
        await db.alerts.insert_one(alert.model_dump())

    profiles = [
        Profile(role="farmer", name="Green Valley Farm", location="Sacramento, CA",
                contact="farmer@greenvalley.com", bio="Family-owned organic farm since 1985"),
        Profile(role="warehouse", name="Central Distribution Hub", location="Oakland, CA",
                contact="ops@centralhub.com", bio="State-of-the-art cold storage facility"),
        Profile(role="retailer", name="Fresh Market Store", location="San Francisco, CA",
                contact="orders@freshmarket.com", bio="Premium grocery retailer serving the Bay Area"),
    ]
    for p in profiles:
        await db.profiles.insert_one(p.model_dump())

    return {"message": "Demo data seeded successfully", "seeded": True}


@api_router.get("/")
async def root():
    return {"message": "Supply Chain Management API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
