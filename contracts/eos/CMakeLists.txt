project(eoscontract NONE)
cmake_minimum_required(VERSION 3.5)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

include(ExternalProject)
# if no cdt root is given use default path
if(EOSIO_CDT_ROOT STREQUAL "" OR NOT EOSIO_CDT_ROOT)
   find_package(eosio.cdt)
endif()
ExternalProject_Add(
               dappservices
               SOURCE_DIR dappservices
               BINARY_DIR dappservices
               CMAKE_ARGS -DCMAKE_TOOLCHAIN_FILE=${EOSIO_CDT_ROOT}/lib/cmake/eosio.cdt/EosioWasmToolchain.cmake
               UPDATE_COMMAND ""
               PATCH_COMMAND ""
               TEST_COMMAND ""
               INSTALL_COMMAND ""
               BUILD_ALWAYS 1
            )

ExternalProject_Add(
               vcpuservice
               SOURCE_DIR vcpuservice
               BINARY_DIR vcpuservice
               CMAKE_ARGS -DCMAKE_TOOLCHAIN_FILE=${EOSIO_CDT_ROOT}/lib/cmake/eosio.cdt/EosioWasmToolchain.cmake
               UPDATE_COMMAND ""
               PATCH_COMMAND ""
               TEST_COMMAND ""
               INSTALL_COMMAND ""
               BUILD_ALWAYS 1
            )

ExternalProject_Add(
               vcpuconsumer
               SOURCE_DIR vcpuconsumer
               BINARY_DIR vcpuconsumer
               CMAKE_ARGS -DCMAKE_TOOLCHAIN_FILE=${EOSIO_CDT_ROOT}/lib/cmake/eosio.cdt/EosioWasmToolchain.cmake
               UPDATE_COMMAND ""
               PATCH_COMMAND ""
               TEST_COMMAND ""
               INSTALL_COMMAND ""
               BUILD_ALWAYS 1
            )

ExternalProject_Add(
               cryptoservice
               SOURCE_DIR cryptoservice
               BINARY_DIR cryptoservice
               CMAKE_ARGS -DCMAKE_TOOLCHAIN_FILE=${EOSIO_CDT_ROOT}/lib/cmake/eosio.cdt/EosioWasmToolchain.cmake
               UPDATE_COMMAND ""
               PATCH_COMMAND ""
               TEST_COMMAND ""
               INSTALL_COMMAND ""
               BUILD_ALWAYS 1
            )

ExternalProject_Add(
               cryptoconsumer
               SOURCE_DIR cryptoconsumer
               BINARY_DIR cryptoconsumer
               CMAKE_ARGS -DCMAKE_TOOLCHAIN_FILE=${EOSIO_CDT_ROOT}/lib/cmake/eosio.cdt/EosioWasmToolchain.cmake
               UPDATE_COMMAND ""
               PATCH_COMMAND ""
               TEST_COMMAND ""
               INSTALL_COMMAND ""
               BUILD_ALWAYS 1
            )
