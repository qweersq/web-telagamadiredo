import appVersionService from '../services/appVersionService';

// Get version from app (default 1.0.0)
// Note: Update this when deploying new version
const getAppVersion = () => {
  // Try to get from window (can be set in index.html or build process)
  if (typeof window !== 'undefined' && window.__APP_VERSION__) {
    return window.__APP_VERSION__;
  }
  // Default version - update this when deploying
  return '1.0.12';
};

const PLATFORM = 'web';

// Compare version (1.0.0 vs 1.0.1)
const compareVersion = (v1, v2) => {
  const v1parts = v1.split('.').map(Number);
  const v2parts = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;

    if (v1part < v2part) return -1;
    if (v1part > v2part) return 1;
  }

  return 0;
};

export const checkVersionFromProfile = (profileData) => {
  try {
    const currentVersion = getAppVersion();
    const versionData = profileData?.latest_app_versions?.web;

    if (!versionData) {
      console.log('ℹ️ [VersionChecker] No web version data in profile');
      return null;
    }

    const needsUpdate = compareVersion(currentVersion, versionData.latestVersion) < 0;
    const needsForceUpdate = versionData.minRequiredVersion && compareVersion(currentVersion, versionData.minRequiredVersion) < 0;

    console.log('🌐 [VersionChecker] Current:', currentVersion, 'Latest:', versionData.latestVersion, 'MinReq:', versionData.minRequiredVersion);
    console.log('🌐 [VersionChecker] NeedsUpdate:', needsUpdate, 'NeedsForce:', needsForceUpdate);

    if (needsUpdate || needsForceUpdate) {
      console.log('✅ [VersionChecker] Update found:', versionData.latestVersion);
      return {
        hasUpdate: true,
        latestVersion: versionData.latestVersion,
        forceUpdate: versionData.forceUpdate || needsForceUpdate,
        updateMessage: versionData.updateMessage,
        features: Array.isArray(versionData.features) ? versionData.features : [],
        minRequiredVersion: versionData.minRequiredVersion,
      };
    }

    console.log('ℹ️ [VersionChecker] Already up to date');
    return null;
  } catch (error) {
    console.error('Error checking version from profile:', error);
    return null;
  }
};

// Legacy - keep as fallback
export const checkVersionUpdate = async () => {
  try {
    // Ambil version dari package.json (version yang sedang running)
    const currentVersion = getAppVersion();

    // Check cache interval
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    const now = Date.now();

    // Skip check jika baru saja check (dalam 5 menit)
    if (lastCheck && (now - parseInt(lastCheck)) < CHECK_INTERVAL) {
      return null;
    }

    // Compare dengan latest version dari API
    const response = await appVersionService.checkVersion(PLATFORM, currentVersion);

    if (response.success && response.data) {
      localStorage.setItem(LAST_CHECK_KEY, now.toString());
      return response.data;
    }

    return null;
  } catch (error) {
    console.error('Error checking version:', error);
    return null;
  }
};

