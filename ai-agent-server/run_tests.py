#!/usr/bin/env python3
"""Test runner script for FastAPI Docker integration tests."""

import subprocess
import sys
import time
import requests
from pathlib import Path


def check_service_availability():
    """Check if services are running before starting tests."""
    print("🔍 Checking service availability...")
    
    services = {
        "FastAPI": "http://localhost:8000/health",
        "Ollama": "http://localhost:11434"
    }
    
    for service_name, url in services.items():
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ {service_name} service is running")
            else:
                print(f"⚠️  {service_name} service responded with status {response.status_code}")
        except requests.exceptions.RequestException:
            print(f"❌ {service_name} service is not available at {url}")
            print(f"   Please run 'docker-compose up' to start the services")
            return False
    
    return True


def install_test_dependencies():
    """Install test dependencies if requirements-test.txt exists."""
    requirements_file = Path("requirements-test.txt")
    if requirements_file.exists():
        print("📦 Installing test dependencies...")
        try:
            subprocess.run([
                sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
            ], check=True, capture_output=True)
            print("✅ Test dependencies installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install test dependencies: {e}")
            return False
    return True


def run_tests(test_type="all", verbose=True):
    """Run the test suite with specified options."""
    if not check_service_availability():
        print("\n💡 To start the services, run:")
        print("   docker-compose up")
        return False
    
    if not install_test_dependencies():
        return False
    
    print(f"\n🧪 Running {test_type} tests...")
    
    # Base pytest command
    cmd = [sys.executable, "-m", "pytest"]
    
    if verbose:
        cmd.append("-v")
    
    # Add test selection based on type
    if test_type == "health":
        cmd.extend(["-m", "health"])
    elif test_type == "chat":
        cmd.extend(["-m", "chat"])
    elif test_type == "rag":
        cmd.extend(["-m", "rag"])
    elif test_type == "streaming":
        cmd.extend(["-m", "streaming"])
    elif test_type == "quick":
        cmd.extend(["-m", "not slow"])
    elif test_type == "slow":
        cmd.extend(["-m", "slow"])
    elif test_type == "integration":
        cmd.extend(["-m", "integration"])
    
    # Add tests directory
    cmd.append("tests/")
    
    try:
        result = subprocess.run(cmd, check=False)
        return result.returncode == 0
    except FileNotFoundError:
        print("❌ pytest not found. Please install test dependencies:")
        print("   pip install -r requirements-test.txt")
        return False


def main():
    """Main test runner function."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Run FastAPI Docker integration tests")
    parser.add_argument(
        "test_type", 
        nargs="?", 
        default="all",
        choices=["all", "health", "chat", "rag", "streaming", "quick", "slow", "integration"],
        help="Type of tests to run (default: all)"
    )
    parser.add_argument(
        "-q", "--quiet", 
        action="store_true", 
        help="Run tests in quiet mode"
    )
    parser.add_argument(
        "--no-check", 
        action="store_true", 
        help="Skip service availability check"
    )
    
    args = parser.parse_args()
    
    print("🚀 FastAPI Docker Integration Test Runner")
    print("=" * 50)
    
    if not args.no_check:
        if not check_service_availability():
            sys.exit(1)
    
    success = run_tests(args.test_type, verbose=not args.quiet)
    
    if success:
        print("\n✅ All tests completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Check the output above for details.")
        sys.exit(1)


if __name__ == "__main__":
    main()