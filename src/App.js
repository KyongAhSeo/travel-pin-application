import "./App.css";
import ReactMapGL, { Marker, Popup, NavigationControl, FlyToInterpolator } from "react-map-gl";
import { useEffect, useState } from "react";
import { Room, Star, Edit, Delete } from "@material-ui/icons";
import axios from "axios";
import { format } from "timeago.js";
import Register from "./components/Register";
import Login from "./components/Login";
import _ from "lodash";

function App() {
  const myStorage = window.localStorage;
  const [currentUsername, setCurrentUsername] = useState(myStorage.getItem("user"));
  const [pins, setPins] = useState([]);
  const [currentPlaceId, setCurrentPlaceId] = useState(null);
  const [newPlace, setNewPlace] = useState(null);
  const [title, setTitle] = useState(null);
  const [desc, setDesc] = useState(null);
  const [star, setStar] = useState(0);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [viewport, setViewport] = useState({
    latitude: 37.5326,
    longitude: 127.024612,
    zoom: 4,
  });

  //지도 오픈시 모든 마커 가져오기
  useEffect(() => {
    const getPins = async () => {
      try {
        const allPins = await axios.get("/pins");
        setPins(allPins.data);
      } catch (err) {
        console.log(err);
      }
    };
    getPins();
  }, []);

  //반응형 사이즈 조절
  useEffect(() => {
    const mapResizeEvent = _.throttle(() => {
      setViewport(
        Object.assign(
          {},
          {
            ...viewport,
            width: `${window.innerWidth}px`,
            height: `${window.innerHeight}px`,
          }
        )
      );
    }, 2000);
    window.addEventListener("resize", mapResizeEvent);
    return () => {
      window.removeEventListener("resize", mapResizeEvent);
    };
  }, [viewport]);

  //마커 클릭시 해당 위치로 이동
  const handleMarkerClick = (id, lat, long) => {
    setCurrentPlaceId(id);
    setViewport({ ...viewport, latitude: lat, longitude: long });
  };

  const handleAddClick = (e) => {
    const [longitude, latitude] = e.lngLat;
    setNewPlace({
      lat: latitude,
      long: longitude,
    });
  };

  //새로운 마커 생성
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newPin = {
      username: currentUsername,
      title,
      desc,
      rating: star,
      lat: newPlace.lat,
      long: newPlace.long,
    };

    try {
      const res = await axios.post("/pins", newPin);
      setPins([...pins, res.data]);
      setNewPlace(null);
    } catch (err) {
      console.log(err);
    }
  };

  //로그아웃
  const handleLogout = () => {
    setCurrentUsername(null);
    myStorage.removeItem("user");
  };

  // const handleUpdate = async () => {
  //   try {
  //     await axios.put(`/posts/${post._id}`, {
  //       username: user.username,
  //       title,
  //       desc,
  //     });
  //     setUpdateMode(false);
  //   } catch (err) {}
  // };

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <ReactMapGL
        {...viewport}
        mapboxApiAccessToken={process.env.REACT_APP_MAPBOX}
        width="100%"
        height="100%"
        transitionDuration={200}
        transitionInterpolator={new FlyToInterpolator()}
        mapStyle="mapbox://styles/safak/cknndpyfq268f17p53nmpwira"
        onViewportChange={(viewport) => setViewport(viewport)}
        onDblClick={currentUsername && handleAddClick}
      >
        {pins.map((p) => (
          <>
            <Marker
              latitude={p.lat}
              longitude={p.long}
              offsetLeft={-3.5 * viewport.zoom}
              offsetTop={-7 * viewport.zoom}
            >
              <Room
                style={{
                  fontSize: 7 * viewport.zoom,
                  color: currentUsername === p.username ? "tomato" : "slateblue",
                  cursor: "pointer",
                }}
                onClick={() => handleMarkerClick(p._id, p.lat, p.long)}
              />
            </Marker>

            {p._id === currentPlaceId && (
              <Popup
                key={p._id}
                latitude={p.lat}
                longitude={p.long}
                closeButton={true}
                closeOnClick={false}
                onClose={() => setCurrentPlaceId(null)}
                anchor="left"
              >
                <div className="card">
                  <label>Place</label>
                  <h4 className="place">{p.title}</h4>
                  <label>Review</label>
                  <p className="desc">{p.desc}</p>
                  <label>Rating</label>
                  <div className="stars">{Array(p.rating).fill(<Star className="star" />)}</div>
                  <label>Information</label>
                  <span className="username">
                    Created by <b>{p.username}</b>
                  </span>
                  <span className="date">{format(p.createdAt)}</span>

                  {currentUsername === p.username && (
                    <div className="cardEdit">
                      <Delete className="editIcon" />
                      <Edit className="editIcon" />
                    </div>
                  )}
                </div>
              </Popup>
            )}
          </>
        ))}

        {newPlace && (
          <>
            <Marker
              latitude={newPlace.lat}
              longitude={newPlace.long}
              offsetLeft={-3.5 * viewport.zoom}
              offsetTop={-7 * viewport.zoom}
            >
              <Room
                style={{
                  fontSize: 7 * viewport.zoom,
                  color: "tomato",
                  cursor: "pointer",
                }}
              />
            </Marker>
            <Popup
              latitude={newPlace.lat}
              longitude={newPlace.long}
              closeButton={true}
              closeOnClick={false}
              onClose={() => setNewPlace(null)}
              anchor="left"
            >
              <div>
                <form onSubmit={handleSubmit}>
                  <label>Title</label>
                  <input placeholder="Enter a title" autoFocus onChange={(e) => setTitle(e.target.value)} />
                  <label>Description</label>
                  <textarea
                    placeholder="Say us something about this place."
                    onChange={(e) => setDesc(e.target.value)}
                  />
                  <label>Rating</label>
                  <select onChange={(e) => setStar(e.target.value)}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                  <button type="submit" className="submitButton">
                    Add Pin
                  </button>
                </form>
              </div>
            </Popup>
          </>
        )}

        {currentUsername ? (
          <button className="button logout" onClick={handleLogout}>
            Log out
          </button>
        ) : (
          <div className="buttons">
            <button className="button login" onClick={() => setShowLogin(true)}>
              Log in
            </button>
            <button className="button register" onClick={() => setShowRegister(true)}>
              Register
            </button>
          </div>
        )}

        {showRegister && <Register setShowRegister={setShowRegister} />}

        {showLogin && (
          <Login setShowLogin={setShowLogin} setCurrentUsername={setCurrentUsername} myStorage={myStorage} />
        )}

        <NavigationControl className="naviControl" />
      </ReactMapGL>
    </div>
  );
}

export default App;
