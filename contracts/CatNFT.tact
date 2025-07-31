import "@stdlib/deploy";

// 貓咪 NFT 合約，符合基本 TON NFT 標準
contract CatNFT with Deployable {
    // === 狀態變量 ===
    owner: Address; // 合約擁有者
    nextNftId: Int; // 下一個 NFT ID
    nftSupply: Int; // NFT 總供應量

    // NFT 擁有者映射 (nftId => owner)
    nftOwners: map<Int, Address>;

    // NFT 存在性映射 (nftId => exists)
    nftExists: map<Int, Bool>;

    // === 初始化 ===
    init(owner: Address) {
        self.owner = owner;
        self.nextNftId = 1;
        self.nftSupply = 0;
    }

    // === 核心功能 ===

    // 鑄造 NFT
    receive("mint") {
        // 只有擁有者可以鑄造
        require(sender() == self.owner, "Only owner can mint");

        let nftId: Int = self.nextNftId;
        let recipient: Address = sender();

        // 鑄造 NFT
        self.nftOwners.set(nftId, recipient);
        self.nftExists.set(nftId, true);

        // 更新計數器
        self.nextNftId = self.nextNftId + 1;
        self.nftSupply = self.nftSupply + 1;

        // 發送事件
        emit(NFTMinted {
            nftId,
            owner: recipient,
            timestamp: now(),
        }.toCell());
    }

    // 鑄造 NFT 給指定地址
    receive(msg: MintTo) {
        require(sender() == self.owner, "Only owner can mint");

        let nftId: Int = self.nextNftId;

        // 鑄造 NFT
        self.nftOwners.set(nftId, msg.to);
        self.nftExists.set(nftId, true);

        // 更新計數器
        self.nextNftId = self.nextNftId + 1;
        self.nftSupply = self.nftSupply + 1;

        // 發送事件
        emit(NFTMinted {
            nftId,
            owner: msg.to,
            timestamp: now(),
        }.toCell());
    }

    // 轉移 NFT
    receive(msg: TransferNFT) {
        // 檢查 NFT 是否存在
        require(self.nftExists.get(msg.nftId) == true, "NFT does not exist");

        // 檢查發送者是否是擁有者
        let currentOwner: Address? = self.nftOwners.get(msg.nftId);
        require(currentOwner != null, "NFT owner not found");
        require(sender() == currentOwner!!, "Only NFT owner can transfer");

        // 轉移 NFT
        self.nftOwners.set(msg.nftId, msg.newOwner);

        // 發送事件
        emit(NFTTransferred {
            nftId: msg.nftId,
            from: currentOwner!!,
            to: msg.newOwner,
            timestamp: now(),
        }.toCell());
    }

    // === 查詢方法 ===

    // 獲取 NFT 擁有者
    get fun getNftOwner(nftId: Int): Address? {
        return self.nftOwners.get(nftId);
    }

    // 檢查 NFT 是否存在
    get fun nftExists(nftId: Int): Bool {
        return self.nftExists.get(nftId) == true;
    }

    // 獲取合約資訊
    get fun getContractInfo(): ContractInfo {
        return ContractInfo {
            owner: self.owner,
            nextNftId: self.nextNftId,
            nftSupply: self.nftSupply,
        };
    }

    // 獲取貓咪資訊（基於 NFT ID）
    get fun getCatInfo(nftId: Int): CatInfo {
        if (self.nftExists.get(nftId) != true) {
            return CatInfo {
                name: "",
                rarity: "",
                catType: "",
            };
        }

        // 基於 NFT ID 決定貓咪類型
        let catType: Int = nftId % 4;

        if (catType == 0) {
            return CatInfo {
                name: "Orange Tabby",
                rarity: "Common",
                catType: "Tabby",
            };
        } else if (catType == 1) {
            return CatInfo {
                name: "Siamese Princess",
                rarity: "Rare",
                catType: "Siamese",
            };
        } else if (catType == 2) {
            return CatInfo {
                name: "Maine Coon King",
                rarity: "Epic",
                catType: "Maine Coon",
            };
        } else {
            return CatInfo {
                name: "Cosmic Cat",
                rarity: "Legendary",
                catType: "Cosmic",
            };
        }
    }

    // === 管理功能 ===

    // 提取合約餘額
    receive("withdraw") {
        require(sender() == self.owner, "Only owner can withdraw");

        let balance: Int = myBalance() - ton("0.1");
        if (balance > 0) {
            send(SendParameters {
                to: self.owner,
                value: balance,
                mode: SendRemainingValue,
            });
        }
    }
}

// === 訊息結構 ===

// 鑄造 NFT 給指定地址
message MintTo {
    to: Address;
}

// 轉移 NFT
message TransferNFT {
    nftId: Int;
    newOwner: Address;
}

// === 事件結構 ===

// NFT 鑄造事件
message NFTMinted {
    nftId: Int;
    owner: Address;
    timestamp: Int;
}

// NFT 轉移事件
message NFTTransferred {
    nftId: Int;
    from: Address;
    to: Address;
    timestamp: Int;
}

// === 資料結構 ===

// 合約資訊
struct ContractInfo {
    owner: Address;
    nextNftId: Int;
    nftSupply: Int;
}

// 貓咪資訊
struct CatInfo {
    name: String;
    rarity: String;
    catType: String;
}
