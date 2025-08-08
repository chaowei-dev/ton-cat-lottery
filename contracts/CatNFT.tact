import "@stdlib/deploy";
import "@stdlib/ownable";

// === NFT 貓咪屬性定義 ===
struct CatMetadata {
    name: String;
    description: String;
    rarity: String; // "Common", "Rare", "Epic", "Legendary"
    templateId: Int; // 0: Common, 1: Rare, 2: Epic, 3: Legendary
    attributes: String; // JSON 格式的屬性
    image: String; // 圖片 URL
}

// === NFT 資料結構 ===
struct NFTData {
    owner: Address;
    tokenId: Int;
    metadata: CatMetadata;
    mintTimestamp: Int;
}

// === 訊息結構 ===

// 鑄造 NFT 訊息（從 CatLottery 合約發送）
message MintTo {
    to: Address;
}

// NFT 轉移訊息（符合 TON NFT 標準）
message NFTTransfer {
    queryId: Int;
    newOwner: Address;
    responseDestination: Address;
    customPayload: Cell?;
    forwardAmount: Int;
    forwardPayload: Slice;
}

// NFT 轉移通知訊息
message NFTTransferNotification {
    queryId: Int;
    prevOwner: Address;
    forwardPayload: Slice;
}

// === 事件結構 ===
message NFTMinted {
    tokenId: Int;
    owner: Address;
    rarity: String;
    timestamp: Int;
}

message NFTTransferred {
    tokenId: Int;
    from: Address;
    to: Address;
    timestamp: Int;
}

// === CatNFT 主合約 ===
contract CatNFT with Deployable, Ownable {
    // === 狀態變數 ===
    owner: Address; // 合約擁有者
    authorizedMinter: Address?; // 授權的鑄造者（CatLottery 合約地址）
    nextTokenId: Int; // 下一個 NFT ID
    totalSupply: Int; // 總供應量
    
    // NFT 資料儲存
    nfts: map<Int, NFTData>; // tokenId -> NFT 資料
    ownerNfts: map<Address, Int>; // owner -> token count
    
    // 貓咪模板定義
    catTemplates: map<Int, CatMetadata>; // templateId -> 貓咪屬性

    // === 初始化 ===
    init(owner: Address) {
        self.owner = owner;
        self.authorizedMinter = null;
        self.nextTokenId = 1;
        self.totalSupply = 0;
        
        // 初始化 4 種貓咪模板
        self.initializeCatTemplates();
    }

    // 初始化貓咪模板
    fun initializeCatTemplates() {
        // Common - Tabby
        self.catTemplates.set(0, CatMetadata {
            name: "Tabby",
            description: "友善的虎斑貓",
            rarity: "Common",
            templateId: 0,
            attributes: "{\"personality\":\"friendly\",\"color\":\"orange_tabby\",\"eyes\":\"green\"}",
            image: "https://ton-cat-lottery.com/images/tabby.png"
        });

        // Rare - Siamese Princess  
        self.catTemplates.set(1, CatMetadata {
            name: "Siamese Princess",
            description: "優雅的暹羅貓，藍色眼睛",
            rarity: "Rare", 
            templateId: 1,
            attributes: "{\"personality\":\"elegant\",\"color\":\"siamese_cream\",\"eyes\":\"blue\"}",
            image: "https://ton-cat-lottery.com/images/siamese_princess.png"
        });

        // Epic - Maine Coon King
        self.catTemplates.set(2, CatMetadata {
            name: "Maine Coon King",
            description: "威嚴的緬因貓，王者風範", 
            rarity: "Epic",
            templateId: 2,
            attributes: "{\"personality\":\"majestic\",\"color\":\"maine_coon_brown\",\"eyes\":\"amber\"}",
            image: "https://ton-cat-lottery.com/images/maine_coon_king.png"
        });

        // Legendary - Cosmic Cat
        self.catTemplates.set(3, CatMetadata {
            name: "Cosmic Cat",
            description: "神秘的宇宙貓，來自星空",
            rarity: "Legendary",
            templateId: 3, 
            attributes: "{\"personality\":\"mysterious\",\"color\":\"cosmic_purple\",\"eyes\":\"starlight\"}",
            image: "https://ton-cat-lottery.com/images/cosmic_cat.png"
        });
    }

    // === 核心功能方法 ===

    // 接收鑄造請求（只有授權的鑄造者可以調用）
    receive(msg: MintTo) {
        // 1. 檢查授權
        require(self.authorizedMinter != null, "No authorized minter set");
        require(sender() == self.authorizedMinter!!, "Only authorized minter can mint NFTs");
        
        // 2. 確定稀有度（基於 tokenId）
        let templateId: Int = self.determineRarity(self.nextTokenId);
        let template: CatMetadata? = self.catTemplates.get(templateId);
        require(template != null, "Invalid template");
        
        let catMetadata: CatMetadata = template!!;
        
        // 3. 創建 NFT 資料
        let nftData: NFTData = NFTData {
            owner: msg.to,
            tokenId: self.nextTokenId,
            metadata: catMetadata,
            mintTimestamp: now()
        };
        
        // 4. 儲存 NFT 資料
        self.nfts.set(self.nextTokenId, nftData);
        
        // 5. 更新擁有者資料
        let ownerCount: Int? = self.ownerNfts.get(msg.to);
        let currentCount: Int = ownerCount != null ? ownerCount!! : 0;
        self.ownerNfts.set(msg.to, currentCount + 1);
        
        // 6. 更新狀態
        self.totalSupply = self.totalSupply + 1;
        let mintedTokenId: Int = self.nextTokenId;
        self.nextTokenId = self.nextTokenId + 1;
        
        // 7. 發送鑄造事件
        emit(NFTMinted {
            tokenId: mintedTokenId,
            owner: msg.to,
            rarity: catMetadata.rarity,
            timestamp: now()
        }.toCell());
        
        // 8. 發送轉移通知給新擁有者
        send(SendParameters {
            to: msg.to,
            value: ton("0.01"),
            mode: SendPayGasSeparately,
            bounce: false,
            body: NFTTransferNotification {
                queryId: 0,
                prevOwner: myAddress(),
                forwardPayload: emptySlice()
            }.toCell()
        });
    }

    // NFT 轉移
    receive(msg: NFTTransfer) {
        let tokenId: Int = msg.queryId;
        let nft: NFTData? = self.nfts.get(tokenId);
        
        // 1. 檢查 NFT 是否存在
        require(nft != null, "NFT does not exist");
        let nftData: NFTData = nft!!;
        
        // 2. 檢查權限（只有當前擁有者可以轉移）
        require(sender() == nftData.owner, "Only owner can transfer NFT");
        
        // 3. 更新 NFT 擁有者
        let updatedNft: NFTData = NFTData {
            owner: msg.newOwner,
            tokenId: nftData.tokenId,
            metadata: nftData.metadata,
            mintTimestamp: nftData.mintTimestamp
        };
        self.nfts.set(tokenId, updatedNft);
        
        // 4. 更新擁有者計數
        let oldOwnerCount: Int? = self.ownerNfts.get(nftData.owner);
        if (oldOwnerCount != null) {
            self.ownerNfts.set(nftData.owner, oldOwnerCount!! - 1);
        }
        
        let newOwnerCount: Int? = self.ownerNfts.get(msg.newOwner);
        let currentNewCount: Int = newOwnerCount != null ? newOwnerCount!! : 0;
        self.ownerNfts.set(msg.newOwner, currentNewCount + 1);
        
        // 5. 發送轉移事件
        emit(NFTTransferred {
            tokenId,
            from: nftData.owner,
            to: msg.newOwner,
            timestamp: now()
        }.toCell());
        
        // 6. 發送通知給新擁有者
        if (msg.forwardAmount > 0) {
            send(SendParameters {
                to: msg.newOwner,
                value: msg.forwardAmount,
                mode: SendPayGasSeparately,
                bounce: false,
                body: NFTTransferNotification {
                    queryId: msg.queryId,
                    prevOwner: nftData.owner,
                    forwardPayload: msg.forwardPayload
                }.toCell()
            });
        }
        
        // 7. 回應給原請求者
        if (msg.responseDestination != myAddress()) {
            send(SendParameters {
                to: msg.responseDestination,
                value: ton("0.01"),
                mode: SendPayGasSeparately,
                bounce: false,
                body: emptyCell()
            });
        }
    }

    // === 管理功能 ===

    // 設定授權鑄造者（只有擁有者可以設定）
    receive(msg: SetAuthorizedMinter) {
        require(sender() == self.owner, "Only owner can set authorized minter");
        self.authorizedMinter = msg.minter;
    }

    // 確定稀有度（基於 tokenId 的機率分佈）
    fun determineRarity(tokenId: Int): Int {
        let randomSeed: Int = tokenId + now();
        let rand: Int = abs(randomSeed) % 100;
        
        // 機率分佈：Common 60%, Rare 25%, Epic 10%, Legendary 5%
        if (rand < 60) {
            return 0; // Common
        } else if (rand < 85) {
            return 1; // Rare  
        } else if (rand < 95) {
            return 2; // Epic
        } else {
            return 3; // Legendary
        }
    }

    // === 查詢方法 ===

    // 獲取 NFT 資料
    get fun getNFT(tokenId: Int): NFTData? {
        return self.nfts.get(tokenId);
    }

    // 獲取擁有者的 NFT 數量
    get fun balanceOf(owner: Address): Int {
        let count: Int? = self.ownerNfts.get(owner);
        return count != null ? count!! : 0;
    }

    // 獲取貓咪模板
    get fun getCatTemplate(templateId: Int): CatMetadata? {
        return self.catTemplates.get(templateId);
    }

    // 獲取合約資訊
    get fun getContractInfo(): NFTContractInfo {
        return NFTContractInfo {
            owner: self.owner,
            authorizedMinter: self.authorizedMinter,
            nextTokenId: self.nextTokenId,
            totalSupply: self.totalSupply
        };
    }

    // 獲取所有貓咪模板資訊
    get fun getAllCatTemplates(): map<Int, CatMetadata> {
        return self.catTemplates;
    }
}

// === 管理訊息定義 ===
message SetAuthorizedMinter {
    minter: Address;
}

// === 查詢結構定義 ===
struct NFTContractInfo {
    owner: Address;
    authorizedMinter: Address?;
    nextTokenId: Int;
    totalSupply: Int;
}