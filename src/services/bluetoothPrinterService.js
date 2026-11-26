class BluetoothPrinterService {
  constructor() {
    this.connectedDevice = null;
    this.discoveredDevices = [];
    this.isScanning = false;
  }

  // Check if Bluetooth is available
  async isBluetoothAvailable() {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Bluetooth is not supported in this browser');
      }
      
      const available = await navigator.bluetooth.getAvailability();
      return available;
    } catch (error) {
      console.error('Bluetooth availability check failed:', error);
      return false;
    }
  }

  // Request Bluetooth permission
  async requestBluetoothPermission() {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Bluetooth is not supported in this browser');
      }

      // Request device with no filters to get permission
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: []
      });

      return device;
    } catch (error) {
      console.error('Bluetooth permission request failed:', error);
      throw error;
    }
  }

  // Discover available Bluetooth devices
  async discoverDevices() {
    try {
      this.isScanning = true;
      this.discoveredDevices = [];

      // Request device with common printer service UUIDs
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '0000180a-0000-1000-8000-00805f9b34fb', // Device Information Service
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Common thermal printer service
          '0000180f-0000-1000-8000-00805f9b34fb', // Battery Service
          '0000180a-0000-1000-8000-00805f9b34fb'  // Generic Access Service
        ]
      });

      this.discoveredDevices.push({
        id: device.id,
        name: device.name || 'Unknown Device',
        connected: device.gatt?.connected || false,
        device: device
      });

      return this.discoveredDevices;
    } catch (error) {
      console.error('Device discovery failed:', error);
      throw error;
    } finally {
      this.isScanning = false;
    }
  }

  // Connect to a specific device and discover services
  async connectAndDiscoverServices(deviceId) {
    try {
      const device = this.discoveredDevices.find(d => d.id === deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      if (!device.device.gatt) {
        throw new Error('Device does not support GATT');
      }

      // Connect to the device
      const server = await device.device.gatt.connect();
      this.connectedDevice = {
        device: device.device,
        server: server,
        services: {},
        characteristics: {}
      };

      // Get all services
      const services = await server.getPrimaryServices();
      
      for (const service of services) {
        const serviceInfo = {
          uuid: service.uuid,
          isPrimary: service.isPrimary,
          characteristics: []
        };

        // Get all characteristics for this service
        const characteristics = await service.getCharacteristics();
        
        for (const characteristic of characteristics) {
          const charInfo = {
            uuid: characteristic.uuid,
            properties: characteristic.properties,
            characteristic: characteristic
          };

          serviceInfo.characteristics.push(charInfo);
          this.connectedDevice.characteristics[characteristic.uuid] = characteristic;
        }

        this.connectedDevice.services[service.uuid] = serviceInfo;
      }

      return {
        success: true,
        device: {
          id: device.device.id,
          name: device.device.name,
          services: this.connectedDevice.services
        }
      };
    } catch (error) {
      console.error('Connection and service discovery failed:', error);
      throw error;
    }
  }

  // Auto-detect printer configuration
  async autoDetectPrinterConfig(deviceId) {
    try {
      await this.connectAndDiscoverServices(deviceId);
      
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }

      // Look for common thermal printer service UUIDs
      const commonPrinterServices = [
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // RPP02
        '0000180a-0000-1000-8000-00805f9b34fb', // Device Information
        '0000180f-0000-1000-8000-00805f9b34fb'  // Battery Service
      ];

      let detectedService = null;
      let detectedCharacteristic = null;

      // Find the most likely printer service
      for (const serviceUuid of commonPrinterServices) {
        if (this.connectedDevice.services[serviceUuid]) {
          const service = this.connectedDevice.services[serviceUuid];
          
          // Look for write characteristic
          for (const char of service.characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              detectedService = serviceUuid;
              detectedCharacteristic = char.uuid;
              break;
            }
          }
          
          if (detectedService) break;
        }
      }

      // If no common service found, use the first service with write capability
      if (!detectedService) {
        for (const serviceUuid in this.connectedDevice.services) {
          const service = this.connectedDevice.services[serviceUuid];
          for (const char of service.characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              detectedService = serviceUuid;
              detectedCharacteristic = char.uuid;
              break;
            }
          }
          if (detectedService) break;
        }
      }

      if (!detectedService || !detectedCharacteristic) {
        throw new Error('No suitable printer service found');
      }

      // Determine printer type and capabilities
      const printerType = this.detectPrinterType(deviceId);
      const paperWidth = this.detectPaperWidth(deviceId);
      const encoding = this.detectEncoding(deviceId);

      return {
        success: true,
        config: {
          device_id: deviceId,
          device_name: this.connectedDevice.device.name || 'Unknown Printer',
          service_uuid: detectedService,
          characteristic_uuid: detectedCharacteristic,
          printer_type: printerType,
          paper_width: paperWidth,
          encoding: encoding,
          print_capabilities: ['invoice', 'tag'],
          connection_settings: {
            auto_connect: true,
            timeout: 5000
          }
        }
      };
    } catch (error) {
      console.error('Auto-detect failed:', error);
      throw error;
    }
  }

  // Detect printer type based on device name and services
  detectPrinterType(deviceId) {
    const device = this.discoveredDevices.find(d => d.id === deviceId);
    if (!device) return 'thermal';

    const name = device.name.toLowerCase();
    
    if (name.includes('thermal') || name.includes('pos') || name.includes('rpp')) {
      return 'thermal';
    } else if (name.includes('inkjet')) {
      return 'inkjet';
    } else if (name.includes('laser')) {
      return 'laser';
    }
    
    return 'thermal'; // Default to thermal
  }

  // Detect paper width based on device name
  detectPaperWidth(deviceId) {
    const device = this.discoveredDevices.find(d => d.id === deviceId);
    if (!device) return 58;

    const name = device.name.toLowerCase();
    
    if (name.includes('80') || name.includes('80mm')) {
      return 80;
    } else if (name.includes('58') || name.includes('58mm')) {
      return 58;
    }
    
    return 58; // Default to 58mm
  }

  // Detect encoding based on device capabilities
  detectEncoding(deviceId) {
    // For now, default to CP437 which is most common for thermal printers
    return 'CP437';
  }

  // Test printer connection
  async testConnection(serviceUuid, characteristicUuid) {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }

      const characteristic = this.connectedDevice.characteristics[characteristicUuid];
      if (!characteristic) {
        throw new Error('Characteristic not found');
      }

      // Send a simple test command
      const testCommand = new Uint8Array([0x1B, 0x40]); // ESC @ - Initialize printer
      
      if (characteristic.properties.writeWithoutResponse) {
        await characteristic.writeValueWithoutResponse(testCommand);
      } else if (characteristic.properties.write) {
        await characteristic.writeValue(testCommand);
      } else {
        throw new Error('Characteristic does not support writing');
      }

      return {
        success: true,
        message: 'Printer test successful'
      };
    } catch (error) {
      console.error('Printer test failed:', error);
      throw error;
    }
  }

  // Disconnect from current device
  async disconnect() {
    try {
      if (this.connectedDevice && this.connectedDevice.server) {
        await this.connectedDevice.server.disconnect();
      }
      
      this.connectedDevice = null;
      return { success: true, message: 'Disconnected successfully' };
    } catch (error) {
      console.error('Disconnect failed:', error);
      throw error;
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.connectedDevice?.server?.connected || false,
      device: this.connectedDevice ? {
        id: this.connectedDevice.device.id,
        name: this.connectedDevice.device.name
      } : null
    };
  }

  // Get discovered devices
  getDiscoveredDevices() {
    return this.discoveredDevices;
  }

  // Clear discovered devices
  clearDiscoveredDevices() {
    this.discoveredDevices = [];
  }
}

// Export singleton instance
export default new BluetoothPrinterService();
