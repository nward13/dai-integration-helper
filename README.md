# Dai Integration Helper

Note: This is still a work in progress, and is temporarily not working while I try to catch up with changes to the dai.js library.

## Usage

```git clone --recursive https://github.com/nward13/dai-integration-helper.git``` 
 ```cd dai-integration-helper```  
```npm install```

Start the testchain (this will take a few minutes)  
```cd ./testchain```  
```./scripts/launch --deploy```  

In a separate terminal window run  
```truffle migrate --compile-all``` and  
```npm run start```  
from the dai-integration-helper directory.
