import requests
import sys
import json
from datetime import datetime

class SupplyChainAPITester:
    def __init__(self, base_url="https://supply-chain-hub-167.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, description=""):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if description:
            print(f"   Description: {description}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            self.test_results.append({
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_preview": response.text[:100] if not success else "OK"
            })

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "response_preview": str(e)
            })
            return False, {}

    def test_seed_data(self):
        """Seed initial data"""
        return self.run_test(
            "Seed Data",
            "POST",
            "seed",
            200,
            description="Initialize database with demo data"
        )

    def test_inventory_endpoints(self):
        """Test all inventory CRUD operations"""
        print("\n📦 Testing Inventory Endpoints...")
        
        # Get inventory
        success, inventory_data = self.run_test(
            "Get Inventory",
            "GET", 
            "inventory",
            200,
            description="Fetch all inventory items"
        )
        
        # Create new inventory item
        new_item = {
            "name": "Test Apples",
            "quantity": 100,
            "unit": "kg",
            "quality_grade": "A",
            "price_per_unit": 2.50,
            "category": "fruits",
            "farmer_name": "Test Farm",
            "harvest_date": datetime.now().isoformat()
        }
        
        success, created_item = self.run_test(
            "Create Inventory Item",
            "POST",
            "inventory",
            200,
            data=new_item,
            description="Add new produce item"
        )
        
        if success and created_item:
            item_id = created_item.get('id')
            
            # Update inventory item
            update_data = {
                "quantity": 150,
                "price_per_unit": 3.00
            }
            
            self.run_test(
                "Update Inventory Item",
                "PUT",
                f"inventory/{item_id}",
                200,
                data=update_data,
                description="Update existing inventory item"
            )
            
            # Delete inventory item
            self.run_test(
                "Delete Inventory Item",
                "DELETE",
                f"inventory/{item_id}",
                200,
                description="Remove inventory item"
            )

    def test_order_endpoints(self):
        """Test order management endpoints"""
        print("\n🛒 Testing Order Endpoints...")
        
        # Get existing inventory for order creation
        success, inventory_data = self.run_test(
            "Get Inventory for Orders",
            "GET",
            "inventory", 
            200
        )
        
        # Get orders
        self.run_test(
            "Get Orders",
            "GET",
            "orders",
            200,
            description="Fetch all orders"
        )
        
        if success and inventory_data and len(inventory_data) > 0:
            # Create order using first available item
            first_item = inventory_data[0]
            order_data = {
                "inventory_id": first_item['id'],
                "item_name": first_item['name'],
                "quantity": min(10, first_item['quantity']),
                "unit": first_item['unit'],
                "total_price": 10 * first_item['price_per_unit'],
                "retailer_name": "Test Retailer"
            }
            
            success, created_order = self.run_test(
                "Create Order",
                "POST",
                "orders",
                200,
                data=order_data,
                description="Place new order"
            )
            
            if success and created_order:
                order_id = created_order.get('id')
                
                # Update order status
                status_update = {
                    "status": "confirmed",
                    "warehouse_status": "processing"
                }
                
                self.run_test(
                    "Update Order Status",
                    "PUT",
                    f"orders/{order_id}/status",
                    200,
                    data=status_update,
                    description="Update order processing status"
                )

    def test_sales_endpoints(self):
        """Test sales tracking endpoints"""
        print("\n💰 Testing Sales Endpoints...")
        
        # Get sales
        self.run_test(
            "Get Sales",
            "GET",
            "sales",
            200,
            description="Fetch all sales records"
        )
        
        # Create sale record
        sale_data = {
            "item_name": "Test Tomatoes",
            "quantity": 25,
            "unit": "kg", 
            "sale_price": 87.50,
            "retailer_name": "Test Store"
        }
        
        self.run_test(
            "Create Sale Record",
            "POST",
            "sales",
            200,
            data=sale_data,
            description="Record new sale"
        )

    def test_dashboard_endpoints(self):
        """Test dashboard metrics for all roles"""
        print("\n📊 Testing Dashboard Endpoints...")
        
        roles = ['farmer', 'warehouse', 'retailer']
        for role in roles:
            self.run_test(
                f"Get {role.title()} Dashboard",
                "GET",
                f"dashboard/{role}",
                200,
                description=f"Fetch {role} dashboard metrics"
            )

    def test_alerts_endpoints(self):
        """Test alerts system"""
        print("\n🔔 Testing Alerts Endpoints...")
        
        # Get alerts
        self.run_test(
            "Get All Alerts",
            "GET",
            "alerts",
            200,
            description="Fetch all system alerts"
        )
        
        # Get role-specific alerts
        for role in ['farmer', 'warehouse', 'retailer']:
            self.run_test(
                f"Get {role.title()} Alerts",
                "GET",
                f"alerts?role={role}",
                200,
                description=f"Fetch {role}-specific alerts"
            )
        
        # Create alert
        alert_data = {
            "type": "test",
            "severity": "info",
            "message": "Test alert from API testing",
            "role": "farmer"
        }
        
        self.run_test(
            "Create Alert",
            "POST",
            "alerts",
            200,
            data=alert_data,
            description="Create new system alert"
        )

    def test_warehouse_iot(self):
        """Test warehouse IoT simulation"""
        print("\n🌡️ Testing Warehouse IoT...")
        
        self.run_test(
            "Get IoT Data",
            "GET",
            "warehouse/iot",
            200,
            description="Fetch warehouse sensor data"
        )

    def test_profiles_endpoints(self):
        """Test profile management"""
        print("\n👤 Testing Profile Endpoints...")
        
        roles = ['farmer', 'warehouse', 'retailer']
        for role in roles:
            # Get profile
            success, profile_data = self.run_test(
                f"Get {role.title()} Profile",
                "GET",
                f"profiles/{role}",
                200,
                description=f"Fetch {role} profile"
            )
            
            if success and profile_data:
                # Update profile
                updated_profile = {
                    "role": role,
                    "name": f"Updated {role.title()} Name",
                    "location": f"Updated {role.title()} Location",
                    "contact": f"updated-{role}@test.com",
                    "bio": f"Updated bio for {role}"
                }
                
                self.run_test(
                    f"Update {role.title()} Profile",
                    "PUT",
                    f"profiles/{role}",
                    200,
                    data=updated_profile,
                    description=f"Update {role} profile information"
                )

    def test_root_endpoint(self):
        """Test API root endpoint"""
        print("\n🏠 Testing Root Endpoint...")
        
        self.run_test(
            "API Root",
            "GET",
            "",
            200,
            description="Test API root endpoint"
        )

def main():
    print("🚀 Starting Supply Chain Management API Tests")
    print("=" * 60)
    
    tester = SupplyChainAPITester()
    
    # Run all tests
    tester.test_root_endpoint()
    tester.test_seed_data()
    tester.test_inventory_endpoints()
    tester.test_order_endpoints()
    tester.test_sales_endpoints()
    tester.test_dashboard_endpoints()
    tester.test_alerts_endpoints()
    tester.test_warehouse_iot()
    tester.test_profiles_endpoints()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    # Print failed tests
    failed_tests = [t for t in tester.test_results if not t['success']]
    if failed_tests:
        print(f"\n❌ Failed Tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test['name']}: {test['actual_status']} (expected {test['expected_status']})")
            print(f"     Error: {test['response_preview']}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())