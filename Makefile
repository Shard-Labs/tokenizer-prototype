help:
	@echo Make sure to have echidna installed
	@echo 1- Run: make echidna-build
	@echo 2- Run: make echidna

echidna-build:
	crytic-compile .

echidna:
	@echo
	@echo ------------------------Asset-------------------------------
	echidna-test . --contract AssetTest --config echidna.yaml
	@echo
	@echo ------------------------AssetFactory------------------------
	echidna-test . --contract AssetFactoryTest --config echidna.yaml
	@echo
	@echo ------------------------Issuer------------------------------
	echidna-test . --contract IssuerTest --config echidna.yaml
	@echo
	@echo ------------------------IssuerFactory-----------------------
	echidna-test . --contract IssuerFactoryTest --config echidna.yaml
	@echo
	@echo ------------------------CfManagerSoftcap-------------------------------
	echidna-test . --contract CfManagerSoftcapTest --config echidna.yaml  
	@echo
	@echo ------------------------CfManagerSoftcapFactory------------------------
	echidna-test . --contract CfManagerSoftcapFactoryTest --config echidna.yaml
	@echo
	@echo ------------------------PayoutManager------------------------------
	echidna-test . --contract PayoutManagerTest --config echidna.yaml
	@echo
	@echo ------------------------PayoutManagerFactory-----------------------
	echidna-test . --contract IssuerFactoryTest --config echidna.yaml
	@echo